export type FeatureFlagName =
  | 'interaction'
  | 'locomotion'
  | 'progressHud'
  | 'miniMap'
  | 'progressiveAssets'
  | 'serviceWorker';

export const FEATURE_FLAGS: Record<FeatureFlagName, boolean> = {
  interaction: true,
  locomotion: true,
  progressHud: true,
  miniMap: true,
  progressiveAssets: true,
  serviceWorker: true,
};

export function isFeatureEnabled(flag: FeatureFlagName) {
  return FEATURE_FLAGS[flag];
}
