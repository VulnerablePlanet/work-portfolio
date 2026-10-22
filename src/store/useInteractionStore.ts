import { create } from 'zustand';
import type { ContentBlock } from '@/domain/room/document';
import { useProgressStore } from '@/store/useProgressStore';

export type InteractionContent = ContentBlock;

interface InteractionState {
  hoveredObjectId: string | null;
  activeObjectId: string | null;
  activeContent: InteractionContent | null;
  setHoveredObject: (objectId: string | null) => void;
  activateObject: (objectId: string, content: InteractionContent) => void;
  finishCloseActiveObject: () => void;
}

export const useInteractionStore = create<InteractionState>((set, get) => ({
  hoveredObjectId: null,
  activeObjectId: null,
  activeContent: null,
  setHoveredObject: (hoveredObjectId) => {
    const current = get();

    if (current.activeContent) {
      return;
    }

    if (hoveredObjectId === current.hoveredObjectId) {
      return;
    }

    set({ hoveredObjectId });
  },
  activateObject: (activeObjectId, activeContent) => {
    useProgressStore.getState().markVisited(activeObjectId);

    set({
      activeObjectId,
      activeContent,
      hoveredObjectId: activeObjectId,
    });
  },
  finishCloseActiveObject: () =>
    set({
      activeObjectId: null,
      activeContent: null,
      hoveredObjectId: null,
    }),
}));
