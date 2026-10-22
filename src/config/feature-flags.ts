export type FeatureFlagName = 'progressHud' | 'miniMap' | 'serviceWorker';

export const FEATURE_FLAGS: Record<FeatureFlagName, boolean> = {
  progressHud: true,
  miniMap: true,
  serviceWorker: true,
};

export function isFeatureEnabled(flag: FeatureFlagName) {
  return FEATURE_FLAGS[flag];
}
