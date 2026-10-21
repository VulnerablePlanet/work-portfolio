import type {
  BootstrapDirectives,
  GraphicsCapabilities,
  QualityTier,
  RendererBackend,
} from '@/types/capabilities';

interface NavigatorWithHints extends Navigator {
  deviceMemory?: number;
  gpu?: object;
}

function hasWebGL2Support() {
  const canvas = document.createElement('canvas');
  return canvas.getContext('webgl2') !== null;
}

function resolveQualityTier({
  deviceMemory,
  hardwareConcurrency,
  isTouchPrimary,
  prefersReducedMotion,
}: {
  deviceMemory: number | null;
  hardwareConcurrency: number | null;
  isTouchPrimary: boolean;
  prefersReducedMotion: boolean;
}): QualityTier {
  if (prefersReducedMotion || isTouchPrimary) {
    return 'low';
  }

  if ((deviceMemory ?? 8) >= 8 && (hardwareConcurrency ?? 8) >= 8) {
    return 'high';
  }

  return 'medium';
}

export function readBootstrapDirectives(search: string): BootstrapDirectives {
  const params = new URLSearchParams(search);

  return {
    forceFallback: params.get('fallback') === '1',
    forceWebGL: params.get('renderer') === 'webgl2',
    forceBootFailure: params.get('failboot') === '1',
  };
}

export function detectGraphicsCapabilities(
  directives: BootstrapDirectives,
): GraphicsCapabilities {
  const navigatorWithHints = navigator as NavigatorWithHints;
  const webgpuSupported = typeof navigatorWithHints.gpu !== 'undefined';
  const webgl2Supported = hasWebGL2Support();
  const isTouchPrimary =
    window.matchMedia('(pointer: coarse)').matches ||
    navigator.maxTouchPoints > 0;
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;
  const deviceMemory = navigatorWithHints.deviceMemory ?? null;
  const hardwareConcurrency = navigator.hardwareConcurrency ?? null;

  let renderMode: RendererBackend = 'fallback';

  if (directives.forceWebGL && webgl2Supported) {
    renderMode = 'webgl2';
  } else if (webgpuSupported) {
    renderMode = 'webgpu';
  } else if (webgl2Supported) {
    renderMode = 'webgl2';
  }

  const fallbackReason =
    renderMode === 'fallback'
      ? 'El navegador no expone WebGPU ni WebGL 2.'
      : null;

  return {
    renderMode,
    preferredBackend: renderMode === 'webgpu' ? 'webgpu' : 'webgl2',
    webgpuSupported,
    webgl2Supported,
    isTouchPrimary,
    prefersReducedMotion,
    deviceMemory,
    hardwareConcurrency,
    qualityTier: resolveQualityTier({
      deviceMemory,
      hardwareConcurrency,
      isTouchPrimary,
      prefersReducedMotion,
    }),
    fallbackReason,
    directives,
  };
}

export function buildFallbackUrl(reason: string) {
  const url = new URL('/fallback.html', window.location.origin);
  url.searchParams.set('reason', reason);
  return url.toString();
}
