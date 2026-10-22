import { getInteractiveNodes } from '@/domain/room/selectors';
import {
  countVisitedObjects,
  getProgressRatio,
  useProgressStore,
} from '@/store/useProgressStore';
import { useRoomStore } from '@/store/useRoomStore';
import { useSessionStore } from '@/store/useSessionStore';

export function ProgressTracker() {
  const screen = useSessionStore((state) => state.screen);
  const document = useRoomStore((state) => state.document);
  const visitedObjectIds = useProgressStore((state) => state.visitedObjectIds);
  const resetProgress = useProgressStore((state) => state.resetProgress);

  if (screen !== 'exploring') {
    return null;
  }

  const interactiveNodes = getInteractiveNodes(document);
  const validIds = interactiveNodes.map((node) => node.id);
  const visitedCount = countVisitedObjects(visitedObjectIds, validIds);
  const ratio = getProgressRatio(visitedCount, interactiveNodes.length);
  const percent = Math.round(ratio * 100);

  return (
    <section className="progress-tracker" aria-label="Progreso de exploracion">
      <div className="progress-tracker__header">
        <span>Descubrimiento</span>
        <strong>
          {visitedCount}/{interactiveNodes.length}
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
