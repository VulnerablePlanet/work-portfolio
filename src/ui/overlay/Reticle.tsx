import { useSessionStore } from '@/store/useSessionStore';
import { useInteractionStore } from '@/store/useInteractionStore';

export function Reticle() {
  const screen = useSessionStore((state) => state.screen);
  const look = useSessionStore((state) => state.look);
  const hoveredObjectId = useInteractionStore((state) => state.hoveredObjectId);
  const isExploring =
    screen === 'exploring' && (look === 'pointer' || look === 'fallback');
  const isInteractive = isExploring && Boolean(hoveredObjectId);

  if (!isExploring) {
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
