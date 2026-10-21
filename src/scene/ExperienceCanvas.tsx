import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { StatsGl } from '@react-three/drei';
import { Perf } from 'r3f-perf';
import { resolveQualityProfile } from '@/app/bootstrap/quality-tier';
import { FocusCameraRig } from '@/camera/FocusCameraRig';
import '@/scene/three-catalog';
import { createRenderer } from '@/engine/renderer/renderer-factory';
import { InteractionManager } from '@/interaction/InteractionManager';
import { RoomShell } from '@/scene/RoomShell';
import { useAppStore } from '@/store/useAppStore';

export function ExperienceCanvas() {
  const capabilities = useAppStore((state) => state.capabilities);
  const rendererBackend = useAppStore((state) => state.rendererBackend);
  const bootstrapPhase = useAppStore((state) => state.bootstrapPhase);
  const showPerf = useAppStore((state) => state.showPerf);
  const showStats = useAppStore((state) => state.showStats);
  const setRendererBackend = useAppStore((state) => state.setRendererBackend);
  const setBootstrapPhase = useAppStore((state) => state.setBootstrapPhase);
  const setBootError = useAppStore((state) => state.setBootError);

  if (!capabilities) {
    return null;
  }

  const qualityProfile = resolveQualityProfile(capabilities);
  const profilingAllowed =
    rendererBackend === 'webgpu' && bootstrapPhase === 'ready';
  const shouldRenderPerf = import.meta.env.DEV && profilingAllowed && showPerf;
  const shouldRenderStats =
    import.meta.env.DEV && profilingAllowed && showStats;

  return (
    <div className="canvas-shell" data-renderer={rendererBackend}>
      <Canvas
        shadows={qualityProfile.enableShadows}
        dpr={qualityProfile.dprRange}
        frameloop="always"
        camera={{ fov: 50, position: [0, 1.5, 4.5], near: 0.1, far: 100 }}
        gl={async (props) =>
          createRenderer(props as Parameters<typeof createRenderer>[0], {
            preferredBackend: capabilities.preferredBackend,
            onBackendResolved: (backend) => {
              setRendererBackend(backend);
              setBootstrapPhase('ready');
            },
          }).catch((error: unknown) => {
            const message =
              error instanceof Error
                ? error.message
                : 'No se pudo inicializar el renderer.';

            setBootError(message);
            setBootstrapPhase('failed');
            throw error;
          })
        }
      >
        <Suspense fallback={null}>
          <FocusCameraRig />
          <InteractionManager />
          <RoomShell
            enableShadows={qualityProfile.enableShadows}
            shadowMapSize={qualityProfile.shadowMapSize}
          />
        </Suspense>

        {shouldRenderPerf ? <Perf position="top-left" minimal={false} /> : null}

        {shouldRenderStats ? <StatsGl /> : null}
      </Canvas>
    </div>
  );
}
