import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PORTFOLIO_OBJECTS } from '@/content/interactive-objects';

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
        visitedObjectIds: state.visitedObjectIds.filter((objectId) =>
          PORTFOLIO_OBJECTS.some((object) => object.id === objectId),
        ),
      }),
    },
  ),
);

export function getProgressRatio(visitedObjectIds: string[]) {
  if (PORTFOLIO_OBJECTS.length === 0) {
    return 0;
  }

  return visitedObjectIds.length / PORTFOLIO_OBJECTS.length;
}
