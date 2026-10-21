import {
  ACESFilmicToneMapping,
  PCFSoftShadowMap,
  SRGBColorSpace,
} from 'three';
import { WebGPURenderer } from 'three/webgpu';
import type { RendererBackend } from '@/types/capabilities';

interface RendererFactoryOptions {
  preferredBackend: Exclude<RendererBackend, 'fallback'>;
  onBackendResolved?: (backend: Exclude<RendererBackend, 'fallback'>) => void;
}

type RendererProps = ConstructorParameters<typeof WebGPURenderer>[0];

function configureRenderer(renderer: WebGPURenderer) {
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.setClearColor(0x0a1020, 1);
  return renderer;
}

function getResolvedBackend(
  renderer: WebGPURenderer,
): Exclude<RendererBackend, 'fallback'> {
  const backend = (
    renderer as WebGPURenderer & {
      backend?: {
        isWebGPUBackend?: boolean;
        isWebGLBackend?: boolean;
      };
    }
  ).backend;

  if (backend?.isWebGLBackend) {
    return 'webgl2';
  }

  return 'webgpu';
}

export async function createRenderer(
  props: RendererProps,
  options: RendererFactoryOptions,
) {
  const create = async (forceWebGL: boolean) => {
    const renderer = new WebGPURenderer({
      ...props,
      antialias: true,
      forceWebGL,
    });

    await renderer.init();

    const configuredRenderer = configureRenderer(renderer);
    const resolvedBackend = getResolvedBackend(configuredRenderer);

    options.onBackendResolved?.(resolvedBackend);

    if (!forceWebGL && resolvedBackend === 'webgl2') {
      console.warn(
        'WebGPU requested but the renderer resolved to the internal WebGL2 backend.',
      );
    }

    return configuredRenderer;
  };

  if (options.preferredBackend === 'webgl2') {
    return create(true);
  }

  try {
    return await create(false);
  } catch (webgpuError) {
    console.warn('WebGPU init failed, falling back to WebGL2.', webgpuError);
    return create(true);
  }
}
