import { PORTFOLIO_OBJECTS } from '@/content/interactive-objects';
import { useAppStore } from '@/store/useAppStore';
import { getProgressRatio, useProgressStore } from '@/store/useProgressStore';

export function ProgressTracker() {
  const pointerLockActive = useAppStore((state) => state.pointerLockActive);
  const fallbackLookActive = useAppStore((state) => state.fallbackLookActive);
  const gamePaused = useAppStore((state) => state.gamePaused);
  const visitedObjectIds = useProgressStore((state) => state.visitedObjectIds);
  const resetProgress = useProgressStore((state) => state.resetProgress);
  const ratio = getProgressRatio(visitedObjectIds);
  const percent = Math.round(ratio * 100);

  if ((!pointerLockActive && !fallbackLookActive) || gamePaused) {
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
