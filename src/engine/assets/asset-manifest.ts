export type AssetPriority = 'critical' | 'nearby' | 'deferred';
export type AssetStage = 'placeholder' | 'low' | 'high';

export interface ProgressiveAssetDefinition {
  id: string;
  label: string;
  priority: AssetPriority;
  placeholderTriangles: number;
  targetTriangles: number;
  notes: string;
}

export const PROGRESSIVE_ASSETS: ProgressiveAssetDefinition[] = [
  {
    id: 'room-shell',
    label: 'Room shell',
    priority: 'critical',
    placeholderTriangles: 120,
    targetTriangles: 2400,
    notes: 'Geometria analitica critica para TTI; futuro swap a GLB comprimido.',
  },
  {
    id: 'architecture-console',
    label: 'Architecture console',
    priority: 'nearby',
    placeholderTriangles: 12,
    targetTriangles: 1800,
    notes: 'Objeto interactivo cercano; primero placeholder, luego asset hero.',
  },
  {
    id: 'projects-terminal',
    label: 'Projects terminal',
    priority: 'nearby',
    placeholderTriangles: 12,
    targetTriangles: 1600,
    notes: 'Terminal de proyectos lazy-load por zona.',
  },
  {
    id: 'skills-monolith',
    label: 'Skills monolith',
    priority: 'deferred',
    placeholderTriangles: 12,
    targetTriangles: 1400,
    notes: 'Asset diferible hasta aproximacion del usuario.',
  },
];

export function getProgressiveAsset(assetId: string) {
  return PROGRESSIVE_ASSETS.find((asset) => asset.id === assetId) ?? null;
}
