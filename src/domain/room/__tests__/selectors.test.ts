import { describe, expect, it } from 'vitest';
import { WORKSPACE_SEED_V1 } from '@/content/seed/workspace-v1';
import { getInteractiveNodes } from '@/domain/room/selectors';

describe('selectores del documento', () => {
  it('encuentra los tres nodos interactivos de la semilla', () => {
    const nodes = getInteractiveNodes(WORKSPACE_SEED_V1);

    expect(nodes.map((node) => node.id)).toEqual([
      'architecture-console',
      'projects-terminal',
      'skills-monolith',
    ]);
  });
});
