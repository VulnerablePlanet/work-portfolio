import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { updateBootStatus } from '@/app/bootstrap/render-boot-status';
import { useAppStore } from '@/store/useAppStore';
import type { GraphicsCapabilities } from '@/types/capabilities';

export async function start3DApp(capabilities: GraphicsCapabilities) {
  const container = document.getElementById('app');

  if (!container) {
    throw new Error('No se encontró el contenedor #app.');
  }

  useAppStore.setState({
    capabilities,
    rendererBackend: capabilities.preferredBackend,
    bootstrapPhase: 'mounting-3d',
    bootError: null,
    showPerf: import.meta.env.DEV,
    showStats: import.meta.env.DEV,
  });

  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );

  updateBootStatus({
    phase: 'ready',
    message: 'Shell 3D lista.',
  });
}
