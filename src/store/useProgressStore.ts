import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const PROGRESS_SCHEMA_VERSION = 1;

interface ProgressState {
  schemaVersion: number;
  visitedObjectIds: string[];
  markVisited: (objectId: string) => void;
  resetProgress: () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      schemaVersion: PROGRESS_SCHEMA_VERSION,
      visitedObjectIds: [],
      markVisited: (objectId) =>
        set((state) => {
          if (state.visitedObjectIds.includes(objectId)) {
            return state;
          }

          return {
            visitedObjectIds: [...state.visitedObjectIds, objectId],
          };
        }),
      resetProgress: () => set({ visitedObjectIds: [] }),
    }),
    {
      name: 'work-portfolio:progress',
      version: PROGRESS_SCHEMA_VERSION,
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        visitedObjectIds: state.visitedObjectIds,
      }),
    },
  ),
);

export function countVisitedObjects(
  visitedObjectIds: string[],
  validObjectIds: readonly string[],
): number {
  const validIds = new Set(validObjectIds);

  return visitedObjectIds.filter((objectId) => validIds.has(objectId)).length;
}

export function getProgressRatio(
  visitedCount: number,
  totalObjects: number,
): number {
  if (totalObjects <= 0) {
    return 0;
  }

  return Math.min(1, visitedCount / totalObjects);
}
