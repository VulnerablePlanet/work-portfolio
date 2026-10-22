import { describe, expect, it } from 'vitest';
import { PREFAB_CATALOG } from '@/domain/prefabs/catalog';
import { PREFAB_COMPONENTS } from '@/presentation/prefabs/registry';

describe('registro de prefabs', () => {
  it('tiene geometría para cada prefab del catálogo', () => {
    for (const prefab of PREFAB_CATALOG) {
      expect(PREFAB_COMPONENTS[prefab.id]).toBeDefined();
    }
  });

  it('no registra prefabs que no existan en el catálogo', () => {
    const catalogIds = new Set(PREFAB_CATALOG.map((prefab) => prefab.id));

    for (const id of Object.keys(PREFAB_COMPONENTS)) {
      expect(catalogIds.has(id)).toBe(true);
    }
  });
});
