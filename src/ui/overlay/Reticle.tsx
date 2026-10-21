import { useAppStore } from '@/store/useAppStore';
import { useInteractionStore } from '@/store/useInteractionStore';

export function Reticle() {
  const pointerLockActive = useAppStore((state) => state.pointerLockActive);
  const fallbackLookActive = useAppStore((state) => state.fallbackLookActive);
  const gamePaused = useAppStore((state) => state.gamePaused);
  const hoveredObjectId = useInteractionStore((state) => state.hoveredObjectId);
  const mode = useInteractionStore((state) => state.mode);
  const isInteractive = Boolean(hoveredObjectId) && mode !== 'reading';

  if ((!pointerLockActive && !fallbackLookActive) || gamePaused) {
    return null;
  }

  return (
    <div
      className="reticle"
      data-interactive={isInteractive ? 'true' : 'false'}
      aria-hidden="true"
    >
      <span />
      {isInteractive ? <strong>Presiona E</strong> : null}
    </div>
  );
}
