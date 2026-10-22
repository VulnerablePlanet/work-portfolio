import { create } from 'zustand';
import { WORKSPACE_SEED_V1 } from '@/content/seed/workspace-v1';
import type { RoomDocument } from '@/domain/room/document';

interface RoomState {
  document: RoomDocument;
  setDocument: (document: RoomDocument) => void;
}

/**
 * Documento activo. En M0 es la semilla; en M1 se hidrata desde la base de
 * datos. La UI fuera del canvas (minimapa, progreso, menú) lo consume.
 */
export const useRoomStore = create<RoomState>((set) => ({
  document: WORKSPACE_SEED_V1,
  setDocument: (document) => set({ document }),
}));
