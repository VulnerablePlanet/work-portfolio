import type { GraphicsCapabilities, QualityTier } from '@/types/capabilities';

interface QualityProfile {
  tier: QualityTier;
  dprRange: [number, number];
  shadowMapSize: 1024 | 2048;
  enableShadows: boolean;
}

const QUALITY_PROFILES: Record<QualityTier, QualityProfile> = {
  low: {
    tier: 'low',
    dprRange: [1, 1],
    shadowMapSize: 1024,
    enableShadows: false,
  },
  medium: {
    tier: 'medium',
    dprRange: [1, 1.25],
    shadowMapSize: 1024,
    enableShadows: true,
  },
  high: {
    tier: 'high',
    dprRange: [1, 1.5],
    shadowMapSize: 2048,
    enableShadows: true,
  },
};

export function resolveQualityProfile(
  capabilities: GraphicsCapabilities,
): QualityProfile {
  return QUALITY_PROFILES[capabilities.qualityTier];
}
