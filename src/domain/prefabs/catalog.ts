import type { JsonObject, Vec3 } from '@/domain/room/document';

export type PrefabCategory =
  | 'structure'
  | 'furniture'
  | 'display'
  | 'prop'
  | 'light'
  | 'portal';

export type ColliderSpec =
  | { type: 'none' }
  | { type: 'box'; size: Vec3 };

export interface PrefabCost {
  triangles: number;
  textureBytes: number;
}

export interface PrefabDefinition {
  id: string;
  version: number;
  label: string;
  category: PrefabCategory;
  cost: PrefabCost;
  collider: ColliderSpec;
  defaultProps: JsonObject;
  supportsInteraction: boolean;
}

/**
 * Catálogo de prefabs v1: solo metadata y coste. La geometría vive en
 * `src/presentation/prefabs/registry.tsx` y se añade en T0.3/T0.4.
 *
 * Los costes son estimaciones de presupuesto, no mediciones del render.
 */
export const PREFAB_CATALOG: readonly PrefabDefinition[] = [
  {
    id: 'pedestal',
    version: 1,
    label: 'Pedestal',
    category: 'structure',
    cost: { triangles: 24, textureBytes: 0 },
    collider: { type: 'box', size: [0.6, 0.9, 0.6] },
    defaultProps: { width: 0.6, height: 0.9, depth: 0.6 },
    supportsInteraction: true,
  },
  {
    id: 'console',
    version: 1,
    label: 'Consola',
    category: 'furniture',
    cost: { triangles: 36, textureBytes: 0 },
    collider: { type: 'box', size: [1.2, 1.5, 0.8] },
    defaultProps: { width: 1.2, height: 1.5, depth: 0.8 },
    supportsInteraction: true,
  },
  {
    id: 'terminal',
    version: 1,
    label: 'Terminal',
    category: 'furniture',
    cost: { triangles: 36, textureBytes: 0 },
    collider: { type: 'box', size: [1.25, 1.3, 0.75] },
    defaultProps: { width: 1.25, height: 1.3, depth: 0.75 },
    supportsInteraction: true,
  },
  {
    id: 'monolith',
    version: 1,
    label: 'Monolito',
    category: 'display',
    cost: { triangles: 12, textureBytes: 0 },
    collider: { type: 'box', size: [0.9, 1.7, 0.9] },
    defaultProps: { width: 0.9, height: 1.7, depth: 0.9 },
    supportsInteraction: true,
  },
  {
    id: 'shelf',
    version: 1,
    label: 'Estantería',
    category: 'furniture',
    cost: { triangles: 48, textureBytes: 0 },
    collider: { type: 'box', size: [1.8, 2.2, 0.5] },
    defaultProps: { width: 1.8, height: 2.2, depth: 0.5 },
    supportsInteraction: false,
  },
  {
    id: 'desk',
    version: 1,
    label: 'Escritorio',
    category: 'furniture',
    cost: { triangles: 36, textureBytes: 0 },
    collider: { type: 'box', size: [1.6, 0.75, 0.8] },
    defaultProps: { width: 1.6, height: 0.75, depth: 0.8 },
    supportsInteraction: false,
  },
  {
    id: 'chair',
    version: 1,
    label: 'Silla',
    category: 'furniture',
    cost: { triangles: 60, textureBytes: 0 },
    collider: { type: 'box', size: [0.6, 0.9, 0.6] },
    defaultProps: { width: 0.6, height: 0.9, depth: 0.6 },
    supportsInteraction: false,
  },
  {
    id: 'plant',
    version: 1,
    label: 'Planta',
    category: 'prop',
    cost: { triangles: 120, textureBytes: 0 },
    collider: { type: 'box', size: [0.5, 1.2, 0.5] },
    defaultProps: { width: 0.5, height: 1.2, depth: 0.5 },
    supportsInteraction: false,
  },
  {
    id: 'plaque',
    version: 1,
    label: 'Placa',
    category: 'display',
    cost: { triangles: 12, textureBytes: 0 },
    collider: { type: 'box', size: [0.8, 0.6, 0.05] },
    defaultProps: { width: 0.8, height: 0.6, depth: 0.05 },
    supportsInteraction: true,
  },
  {
    id: 'doorway',
    version: 1,
    label: 'Marco de portal',
    category: 'portal',
    cost: { triangles: 24, textureBytes: 0 },
    collider: { type: 'none' },
    defaultProps: { width: 1.2, height: 2.4, depth: 0.3 },
    supportsInteraction: true,
  },
  {
    id: 'spotlight',
    version: 1,
    label: 'Foco',
    category: 'light',
    cost: { triangles: 0, textureBytes: 0 },
    collider: { type: 'none' },
    defaultProps: { intensity: 1 },
    supportsInteraction: false,
  },
  {
    id: 'block',
    version: 1,
    label: 'Bloque',
    category: 'structure',
    cost: { triangles: 12, textureBytes: 0 },
    collider: { type: 'box', size: [2.4, 1.2, 1.1] },
    defaultProps: { width: 2.4, height: 1.2, depth: 1.1 },
    supportsInteraction: false,
  },
];

export function getPrefab(
  prefabId: string,
  prefabVersion: number,
): PrefabDefinition | null {
  return (
    PREFAB_CATALOG.find(
      (prefab) => prefab.id === prefabId && prefab.version === prefabVersion,
    ) ?? null
  );
}

export function listPrefabs(): readonly PrefabDefinition[] {
  return PREFAB_CATALOG;
}
