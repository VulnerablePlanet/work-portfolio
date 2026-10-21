import { create } from 'zustand';
import { useProgressStore } from '@/store/useProgressStore';

export type InteractionMode =
  | 'exploring'
  | 'focusEntering'
  | 'focused'
  | 'reading'
  | 'focusLeaving';

export interface InteractionContent {
  title: string;
  eyebrow: string;
  body: string;
}

interface InteractionState {
  mode: InteractionMode;
  hoveredObjectId: string | null;
  activeObjectId: string | null;
  activeContent: InteractionContent | null;
  isPanelClosing: boolean;
  setHoveredObject: (objectId: string | null) => void;
  activateObject: (objectId: string, content: InteractionContent) => void;
  beginCloseActiveObject: () => void;
  finishCloseActiveObject: () => void;
  closeActiveObject: () => void;
}

export const useInteractionStore = create<InteractionState>((set, get) => ({
  mode: 'exploring',
  hoveredObjectId: null,
  activeObjectId: null,
  activeContent: null,
  isPanelClosing: false,
  setHoveredObject: (hoveredObjectId) => {
    const current = get();

    if (current.mode === 'reading' || current.isPanelClosing) {
      return;
    }

    if (hoveredObjectId === current.hoveredObjectId) {
      return;
    }

    if (hoveredObjectId) {
      set({
        hoveredObjectId,
        mode: 'focusEntering',
      });
      window.setTimeout(() => {
        const latest = get();

        if (
          latest.hoveredObjectId === hoveredObjectId &&
          latest.mode === 'focusEntering'
        ) {
          set({ mode: 'focused' });
        }
      }, 120);
      return;
    }

    set({
      hoveredObjectId: null,
      mode: 'focusLeaving',
    });
    window.setTimeout(() => {
      const latest = get();

      if (latest.hoveredObjectId === null && latest.mode === 'focusLeaving') {
        set({ mode: 'exploring' });
      }
    }, 100);
  },
  activateObject: (activeObjectId, activeContent) => {
    useProgressStore.getState().markVisited(activeObjectId);

    set({
      activeObjectId,
      activeContent,
      hoveredObjectId: activeObjectId,
      mode: 'reading',
      isPanelClosing: false,
    });
  },
  beginCloseActiveObject: () => {
    const current = get();

    if (!current.activeContent || current.isPanelClosing) {
      return;
    }

    set({
      mode: 'focusLeaving',
      isPanelClosing: true,
    });
  },
  finishCloseActiveObject: () =>
    set({
      activeObjectId: null,
      activeContent: null,
      hoveredObjectId: null,
      mode: 'exploring',
      isPanelClosing: false,
    }),
  closeActiveObject: () => get().finishCloseActiveObject(),
}));
