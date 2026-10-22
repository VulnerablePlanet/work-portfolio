import { describe, expect, it } from 'vitest';
import { WORKSPACE_SEED_V1 } from '@/content/seed/workspace-v1';
import type { RoomDocument } from '@/domain/room/document';
import { validateRoomDocument } from '@/domain/room/validation';

describe('validateRoomDocument', () => {
  it('acepta la semilla con contexto de publicación', () => {
    const result = validateRoomDocument(WORKSPACE_SEED_V1, {
      roomId: '11111111-1111-4111-8111-111111111111',
      assetIds: new Set<string>(),
      publishedRoomIds: new Set<string>(),
    });

    expect(result.issues).toEqual([]);
  });

  it('devuelve issues de reglas y presupuesto juntos', () => {
    const document = structuredClone(WORKSPACE_SEED_V1) as RoomDocument;
    document.nodes.push({
      id: 'portal-lab',
      kind: 'portal',
      targetRoomId: '22222222-2222-4222-8222-222222222222',
      label: 'Laboratorio',
      transform: {
        position: [0, 1.2, -4.5],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
    });

    const result = validateRoomDocument(document, {
      roomId: '11111111-1111-4111-8111-111111111111',
      publishedRoomIds: new Set<string>(),
    });

    expect(result.issues.map((issue) => issue.code)).toContain(
      'portal.unpublished',
    );
  });
});
