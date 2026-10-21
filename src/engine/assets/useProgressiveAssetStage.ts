import { useEffect, useState } from 'react';
import { isFeatureEnabled } from '@/config/feature-flags';
import type { AssetStage } from '@/engine/assets/asset-manifest';

const STAGE_DELAYS_MS: Record<AssetStage, number> = {
  placeholder: 0,
  low: 180,
  high: 420,
};

export function useProgressiveAssetStage(assetId: string) {
  const [stage, setStage] = useState<AssetStage>('placeholder');

  useEffect(() => {
    if (!isFeatureEnabled('progressiveAssets')) {
      setStage('high');
      return;
    }

    setStage('placeholder');

    const lowTimer = window.setTimeout(() => {
      setStage('low');
    }, STAGE_DELAYS_MS.low);
    const highTimer = window.setTimeout(() => {
      setStage('high');
    }, STAGE_DELAYS_MS.high);

    return () => {
      window.clearTimeout(lowTimer);
      window.clearTimeout(highTimer);
    };
  }, [assetId]);

  return stage;
}
