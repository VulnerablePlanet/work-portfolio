import { describe, expect, it } from 'vitest';
import { PREFAB_CATALOG, getPrefab, listPrefabs } from '@/domain/prefabs/catalog';

describe('catálogo de prefabs', () => {
  it('no repite id y versión', () => {
    const keys = PREFAB_CATALOG.map(
      (prefab) => `${prefab.id}@${prefab.version}`,
    );

    expect(new Set(keys).size).toBe(keys.length);
  });

  it('declara costes no negativos', () => {
    for (const prefab of PREFAB_CATALOG) {
      expect(prefab.cost.triangles).toBeGreaterThanOrEqual(0);
      expect(prefab.cost.textureBytes).toBeGreaterThanOrEqual(0);
    }
  });

  it('usa cajas de colisión con dimensiones positivas', () => {
    for (const prefab of PREFAB_CATALOG) {
      if (prefab.collider.type === 'box') {
        for (const dimension of prefab.collider.size) {
          expect(dimension).toBeGreaterThan(0);
        }
      }
    }
  });

  it('resuelve un prefab por id y versión', () => {
    const prefab = getPrefab('console', 1);

    expect(prefab?.label).toBe('Consola');
    expect(getPrefab('console', 99)).toBeNull();
    expect(getPrefab('no-existe', 1)).toBeNull();
  });

  it('expone el catálogo completo', () => {
    expect(listPrefabs()).toHaveLength(PREFAB_CATALOG.length);
  });
});
