import { useSessionStore } from '@/store/useSessionStore';
import { PORTFOLIO_OBJECTS } from '@/content/interactive-objects';
import { getProgressRatio, useProgressStore } from '@/store/useProgressStore';

export function ProgressTracker() {
  const screen = useSessionStore((state) => state.screen);
  const visitedObjectIds = useProgressStore((state) => state.visitedObjectIds);
  const resetProgress = useProgressStore((state) => state.resetProgress);
  const ratio = getProgressRatio(visitedObjectIds);
  const percent = Math.round(ratio * 100);

  if (screen !== 'exploring') {
    return null;
  }

  return (
    <section className="progress-tracker" aria-label="Progreso de exploracion">
      <div className="progress-tracker__header">
        <span>Descubrimiento</span>
        <strong>
          {visitedObjectIds.length}/{PORTFOLIO_OBJECTS.length}
        </strong>
      </div>
      <div className="progress-tracker__bar" aria-hidden="true">
        <span style={{ width: `${percent}%` }} />
      </div>
      <button type="button" onClick={resetProgress}>
        Reiniciar progreso
      </button>
    </section>
  );
}
