import { resolveQualityProfile } from '@/app/bootstrap/quality-tier';
import { getInteractiveNodes } from '@/domain/room/selectors';
import { useAppStore } from '@/store/useAppStore';
import { useInteractionStore } from '@/store/useInteractionStore';
import {
  countVisitedObjects,
  useProgressStore,
} from '@/store/useProgressStore';
import { useRoomStore } from '@/store/useRoomStore';
import { useSessionStore } from '@/store/useSessionStore';

export function MainMenu() {
  const capabilities = useAppStore((state) => state.capabilities);
  const rendererBackend = useAppStore((state) => state.rendererBackend);
  const bootstrapPhase = useAppStore((state) => state.bootstrapPhase);
  const showDebugHud = useAppStore((state) => state.showDebugHud);
  const toggleDebugHud = useAppStore((state) => state.toggleDebugHud);
  const screen = useSessionStore((state) => state.screen);
  const error = useSessionStore((state) => state.error);
  const dispatch = useSessionStore((state) => state.dispatch);
  const activeContent = useInteractionStore((state) => state.activeContent);
  const document = useRoomStore((state) => state.document);
  const visitedObjectIds = useProgressStore((state) => state.visitedObjectIds);
  const resetProgress = useProgressStore((state) => state.resetProgress);

  if (activeContent) {
    return null;
  }

  if (screen !== 'menu' && screen !== 'paused') {
    return null;
  }

  const isPaused = screen === 'paused';
  const isSceneReady = bootstrapPhase === 'ready';
  const qualityProfile = capabilities
    ? resolveQualityProfile(capabilities)
    : null;
  const interactiveNodes = getInteractiveNodes(document);
  const visitedCount = countVisitedObjects(
    visitedObjectIds,
    interactiveNodes.map((node) => node.id),
  );
  const progress = `${visitedCount}/${interactiveNodes.length}`;

  const handleEnterRoom = () => {
    if (!isSceneReady) {
      return;
    }

    dispatch({ type: isPaused ? 'RESUME' : 'ENTER' });
  };

  return (
    <section className="main-menu" aria-label="Menu principal del portfolio">
      <div className="main-menu__panel">
        <p className="main-menu__eyebrow">Portfolio interactivo 3D</p>
        <h1>
          {isPaused ? 'Habitación en pausa' : 'Bienvenido al portfolio'}
        </h1>
        <p className="main-menu__lead">
          Explora una habitación 3D con controles tipo videojuego: mouse para
          mirar, WASD para moverte, E para interactuar y ESC para volver a este
          menú.
        </p>

        <div className="main-menu__actions">
          <button
            type="button"
            className="main-menu__primary"
            onClick={handleEnterRoom}
            disabled={!isSceneReady}
          >
            {isSceneReady
              ? isPaused
                ? 'Reanudar habitación'
                : 'Entrar al juego'
              : 'Preparando escena…'}
          </button>
          <a href="/fallback.html" className="main-menu__secondary">
            Ver versión accesible
          </a>
        </div>

        {error ? <p className="main-menu__error">{error}</p> : null}

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
