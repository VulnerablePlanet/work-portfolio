import { Suspense, lazy, useEffect, useState } from 'react';
import type { ClientLoaderFunctionArgs } from 'react-router';
import { useLoaderData } from 'react-router';
import {
  buildFallbackUrl,
  detectGraphicsCapabilities,
  readBootstrapDirectives,
} from '@/app/bootstrap/capability-gate';
import {
  renderBootStatus,
  updateBootStatus,
} from '@/app/bootstrap/render-boot-status';
import { WORKSPACE_SEED_V1 } from '@/content/seed/workspace-v1';
import { useAppStore } from '@/store/useAppStore';
import { useInteractionStore } from '@/store/useInteractionStore';
import { useRoomStore } from '@/store/useRoomStore';
import { resetSession } from '@/store/useSessionStore';

const ExperienceApp = lazy(async () => {
  const module = await import('@/app/App');

  return { default: module.App };
});

export function clientLoader(_args: ClientLoaderFunctionArgs) {
  return { room: WORKSPACE_SEED_V1 };
}

export function HydrateFallback() {
  return (
    <div className="experience-boot">
      <p>Cargando experiencia 3D…</p>
    </div>
  );
}

export default function ExperienceRoute() {
  const { room } = useLoaderData<typeof clientLoader>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    renderBootStatus();
    updateBootStatus({
      phase: 'detecting',
      message: 'Verificando capacidades gráficas del dispositivo…',
    });

    const directives = readBootstrapDirectives(window.location.search);
    const capabilities = detectGraphicsCapabilities(directives);

    if (directives.forceFallback || capabilities.renderMode === 'fallback') {
      window.location.replace(
        buildFallbackUrl(
          directives.forceFallback
            ? 'Fallback forzado por parámetro.'
            : (capabilities.fallbackReason ??
                'Gráficos avanzados no soportados.'),
        ),
      );
      return;
    }

    const cleanup = () => {
      resetSession();
      useInteractionStore.getState().finishCloseActiveObject();
      document.getElementById('boot-status')?.remove();
    };

    if (directives.forceBootFailure) {
      updateBootStatus({
        phase: 'failed',
        message: 'No se pudo iniciar la experiencia 3D.',
        detail: 'Fallo de bootstrap forzado para pruebas.',
        allowFallback: true,
      });
      return cleanup;
    }

    useAppStore.setState({
      capabilities,
      rendererBackend: capabilities.preferredBackend,
      bootstrapPhase: 'mounting-3d',
      bootError: null,
      showPerf: import.meta.env.DEV,
      showStats: import.meta.env.DEV,
    });
    useRoomStore.getState().setDocument(room);
    setReady(true);

    return cleanup;
  }, [room]);

  if (!ready) {
    return (
      <div className="experience-boot">
        <p>Preparando la escena…</p>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="experience-boot">
          <p>Cargando escena…</p>
        </div>
      }
    >
      <ExperienceApp />
    </Suspense>
  );
}
