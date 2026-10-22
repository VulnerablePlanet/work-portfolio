import { describe, expect, it } from 'vitest';
import { WORKSPACE_SEED_V1 } from '@/content/seed/workspace-v1';
import type { RoomDocument } from '@/domain/room/document';
import {
  ROOM_LIMITS,
  estimateRoomBudget,
  validateRoomBudget,
} from '@/domain/room/budgets';

function makeDocument(): RoomDocument {
  return structuredClone(WORKSPACE_SEED_V1) as RoomDocument;
}

describe('presupuestos de habitación', () => {
  it('la semilla está dentro del presupuesto', () => {
    const budget = estimateRoomBudget(WORKSPACE_SEED_V1);
    const issues = validateRoomBudget(budget);

    expect(budget.nodes).toBe(4);
    expect(issues).toEqual([]);
  });

  it('suma los assets referenciados por sus estadísticas', () => {
    const document = makeDocument();
    const assetId = '00000000-0000-4000-8000-000000000001';

    document.nodes.push({
      id: 'asset-node',
      kind: 'asset',
      assetId,
      collider: 'auto',
      transform: {
        position: [0, 1, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
    });

    const budget = estimateRoomBudget(document, {
      [assetId]: { triangles: 1_200, textureBytes: 4_096, bytes: 900 },
    });

    expect(budget.triangles).toBeGreaterThanOrEqual(1_200);
    expect(budget.textureBytes).toBeGreaterThanOrEqual(4_096);
    expect(budget.assetBytes).toBe(900);
  });

  it('reporta exceso de triángulos', () => {
    const issues = validateRoomBudget({
      nodes: 1,
      triangles: ROOM_LIMITS.triangles + 1,
      textureBytes: 0,
      assetBytes: 0,
      documentBytes: 1_024,
    });

    expect(issues.map((issue) => issue.code)).toContain('budget.triangles');
  });

  it('reporta exceso de texturas', () => {
    const issues = validateRoomBudget({
      nodes: 1,
      triangles: 0,
      textureBytes: ROOM_LIMITS.textureBytes + 1,
      assetBytes: 0,
      documentBytes: 1_024,
    });

    expect(issues.map((issue) => issue.code)).toContain('budget.textures');
  });

  it('reporta un documento demasiado grande', () => {
    const issues = validateRoomBudget({
      nodes: 1,
      triangles: 0,
      textureBytes: 0,
      assetBytes: 0,
      documentBytes: ROOM_LIMITS.documentBytes + 1,
    });

    expect(issues.map((issue) => issue.code)).toContain('budget.document');
  });
});
