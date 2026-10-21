import { create } from 'zustand';
import type {
  BootstrapPhase,
  GraphicsCapabilities,
  RendererBackend,
} from '@/types/capabilities';

interface AppState {
  capabilities: GraphicsCapabilities | null;
  rendererBackend: Exclude<RendererBackend, 'fallback'>;
  bootstrapPhase: BootstrapPhase;
  bootError: string | null;
  pointerLockError: string | null;
  pointerLockActive: boolean;
  fallbackLookActive: boolean;
  gameStarted: boolean;
  gamePaused: boolean;
  showDebugHud: boolean;
  showPerf: boolean;
  showStats: boolean;
  setCapabilities: (capabilities: GraphicsCapabilities) => void;
  setRendererBackend: (backend: Exclude<RendererBackend, 'fallback'>) => void;
  setBootstrapPhase: (phase: BootstrapPhase) => void;
  setBootError: (error: string | null) => void;
  setPointerLockError: (error: string | null) => void;
  setPointerLockActive: (active: boolean) => void;
  setFallbackLookActive: (active: boolean) => void;
  setGameStarted: (started: boolean) => void;
  setGamePaused: (paused: boolean) => void;
  toggleDebugHud: () => void;
  togglePerf: () => void;
  toggleStats: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  capabilities: null,
  rendererBackend: 'webgl2',
  bootstrapPhase: 'detecting',
  bootError: null,
  pointerLockError: null,
  pointerLockActive: false,
  fallbackLookActive: false,
  gameStarted: false,
  gamePaused: true,
  showDebugHud: false,
  showPerf: import.meta.env.DEV,
  showStats: import.meta.env.DEV,
  setCapabilities: (capabilities) => set({ capabilities }),
  setRendererBackend: (rendererBackend) => set({ rendererBackend }),
  setBootstrapPhase: (bootstrapPhase) => set({ bootstrapPhase }),
  setBootError: (bootError) => set({ bootError }),
  setPointerLockError: (pointerLockError) => set({ pointerLockError }),
  setPointerLockActive: (pointerLockActive) => set({ pointerLockActive }),
  setFallbackLookActive: (fallbackLookActive) => set({ fallbackLookActive }),
  setGameStarted: (gameStarted) => set({ gameStarted }),
  setGamePaused: (gamePaused) => set({ gamePaused }),
  toggleDebugHud: () => set((state) => ({ showDebugHud: !state.showDebugHud })),
  togglePerf: () => set((state) => ({ showPerf: !state.showPerf })),
  toggleStats: () => set((state) => ({ showStats: !state.showStats })),
}));
