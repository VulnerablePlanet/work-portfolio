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
  showDebugHud: boolean;
  showPerf: boolean;
  showStats: boolean;
  setCapabilities: (capabilities: GraphicsCapabilities) => void;
  setRendererBackend: (backend: Exclude<RendererBackend, 'fallback'>) => void;
  setBootstrapPhase: (phase: BootstrapPhase) => void;
  setBootError: (error: string | null) => void;
  toggleDebugHud: () => void;
  togglePerf: () => void;
  toggleStats: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  capabilities: null,
  rendererBackend: 'webgl2',
  bootstrapPhase: 'detecting',
  bootError: null,
  showDebugHud: false,
  showPerf: import.meta.env.DEV,
  showStats: import.meta.env.DEV,
  setCapabilities: (capabilities) => set({ capabilities }),
  setRendererBackend: (rendererBackend) => set({ rendererBackend }),
  setBootstrapPhase: (bootstrapPhase) => set({ bootstrapPhase }),
  setBootError: (bootError) => set({ bootError }),
  toggleDebugHud: () => set((state) => ({ showDebugHud: !state.showDebugHud })),
  togglePerf: () => set((state) => ({ showPerf: !state.showPerf })),
  toggleStats: () => set((state) => ({ showStats: !state.showStats })),
}));
