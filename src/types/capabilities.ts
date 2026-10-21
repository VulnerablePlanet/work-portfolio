export type RendererBackend = 'webgpu' | 'webgl2' | 'fallback';
export type QualityTier = 'low' | 'medium' | 'high';

export interface BootstrapDirectives {
  forceFallback: boolean;
  forceWebGL: boolean;
  forceBootFailure: boolean;
}

export interface GraphicsCapabilities {
  renderMode: RendererBackend;
  preferredBackend: Exclude<RendererBackend, 'fallback'>;
  webgpuSupported: boolean;
  webgl2Supported: boolean;
  isTouchPrimary: boolean;
  prefersReducedMotion: boolean;
  deviceMemory: number | null;
  hardwareConcurrency: number | null;
  qualityTier: QualityTier;
  fallbackReason: string | null;
  directives: BootstrapDirectives;
}

export type BootstrapPhase =
  | 'detecting'
  | 'loading-shell'
  | 'mounting-3d'
  | 'ready'
  | 'failed';
