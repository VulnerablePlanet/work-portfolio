import { requestGamePointerLock } from '@/player/pointer-lock-events';
import { useAppStore } from '@/store/useAppStore';

export function GameModeControls() {
  const pointerLockActive = useAppStore((state) => state.pointerLockActive);
  const gamePaused = useAppStore((state) => state.gamePaused);

  if (pointerLockActive) {
    return null;
  }

  return (
    <div className="game-mode-controls" data-paused={gamePaused}>
      <p className="game-mode-controls__eyebrow">
        {gamePaused ? 'Juego en pausa' : 'Modo habitación'}
      </p>
      <button type="button" onClick={requestGamePointerLock}>
        {gamePaused ? 'Reanudar habitación' : 'Entrar al modo habitación'}
      </button>
      <p>
        Control tipo Minecraft: al entrar, el mouse queda capturado y puedes
        mirar libremente sin mantener click. Presiona ESC para pausar y recuperar
        el cursor.
      </p>
    </div>
  );
}
