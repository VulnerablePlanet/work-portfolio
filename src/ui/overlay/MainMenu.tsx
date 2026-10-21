import { requestGamePointerLock } from '@/player/pointer-lock-events';
import { resolveQualityProfile } from '@/app/bootstrap/quality-tier';
import { useAppStore } from '@/store/useAppStore';
import { useInteractionStore } from '@/store/useInteractionStore';
import { useProgressStore } from '@/store/useProgressStore';
import { PORTFOLIO_OBJECTS } from '@/content/interactive-objects';

export function MainMenu() {
  const capabilities = useAppStore((state) => state.capabilities);
  const rendererBackend = useAppStore((state) => state.rendererBackend);
  const gameStarted = useAppStore((state) => state.gameStarted);
  const gamePaused = useAppStore((state) => state.gamePaused);
  const pointerLockActive = useAppStore((state) => state.pointerLockActive);
  const fallbackLookActive = useAppStore((state) => state.fallbackLookActive);
  const setFallbackLookActive = useAppStore((state) => state.setFallbackLookActive);
  const setGameStarted = useAppStore((state) => state.setGameStarted);
  const setGamePaused = useAppStore((state) => state.setGamePaused);
  const pointerLockError = useAppStore((state) => state.pointerLockError);
  const setPointerLockError = useAppStore((state) => state.setPointerLockError);
  const showDebugHud = useAppStore((state) => state.showDebugHud);
  const toggleDebugHud = useAppStore((state) => state.toggleDebugHud);
  const visitedObjectIds = useProgressStore((state) => state.visitedObjectIds);
  const resetProgress = useProgressStore((state) => state.resetProgress);
  const activeContent = useInteractionStore((state) => state.activeContent);

  // Al leer un objeto se sale del pointer lock y el juego queda en pausa.
  // El panel de lectura debe tener prioridad sobre el menú de pausa.
  if (activeContent) {
    return null;
  }

  if ((pointerLockActive || fallbackLookActive) && !gamePaused) {
    return null;
  }

  const qualityProfile = capabilities ? resolveQualityProfile(capabilities) : null;
  const progress = `${visitedObjectIds.length}/${PORTFOLIO_OBJECTS.length}`;

  const handleEnterRoom = () => {
    setPointerLockError(null);
    void requestGamePointerLock().catch((error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : 'El navegador rechaz? la captura del mouse.';

      setPointerLockError(
        `${message} Modo compatible activado: mueve el mouse dentro de la ventana. Para control infinito real, usa Chrome/Edge normal.`,
      );
      setGameStarted(true);
      setGamePaused(false);
      setFallbackLookActive(true);
    });
  };

  return (
    <section className="main-menu" aria-label="Menu principal del portfolio">
      <div className="main-menu__panel">
        <p className="main-menu__eyebrow">Portfolio interactivo 3D</p>
        <h1>{gameStarted ? 'Habitación en pausa' : 'Bienvenido al portfolio'}</h1>
        <p className="main-menu__lead">
          Explora una habitación 3D con controles tipo videojuego: mouse para
          mirar, WASD para moverte, E para interactuar y ESC para volver a este
          menú.
        </p>

        <div className="main-menu__actions">
          <button type="button" className="main-menu__primary" onClick={handleEnterRoom}>
            {gameStarted ? 'Reanudar habitación' : 'Entrar al juego'}
          </button>
          <a href="/fallback.html" className="main-menu__secondary">
            Ver versión accesible
          </a>
        </div>

        {pointerLockError ? (
          <p className="main-menu__error">
            {pointerLockError}
          </p>
        ) : null}

        <div className="main-menu__grid" aria-label="Configuracion actual">
          <div>
            <span>Render</span>
            <strong>{rendererBackend}</strong>
          </div>
          <div>
            <span>Calidad</span>
            <strong>{capabilities?.qualityTier ?? 'detectando'}</strong>
          </div>
          <div>
            <span>DPR</span>
            <strong>
              {qualityProfile
                ? `${qualityProfile.dprRange[0]}-${qualityProfile.dprRange[1]}`
                : '—'}
            </strong>
          </div>
          <div>
            <span>Progreso</span>
            <strong>{progress}</strong>
          </div>
        </div>

        <div className="main-menu__settings">
          <button type="button" onClick={toggleDebugHud}>
            HUD técnico: {showDebugHud ? 'visible' : 'oculto'}
          </button>
          <button type="button" onClick={resetProgress}>
            Reiniciar progreso
          </button>
        </div>

        <p className="main-menu__hint">
          Si el navegador pide permiso para capturar el mouse, acéptalo. Esa es
          la misma base técnica que usan controles tipo Minecraft en web.
        </p>
      </div>
    </section>
  );
}
