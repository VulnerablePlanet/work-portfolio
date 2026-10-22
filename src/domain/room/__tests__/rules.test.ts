import { describe, expect, it } from 'vitest';
import { WORKSPACE_SEED_V1 } from '@/content/seed/workspace-v1';
import type { RoomDocument, RoomNode } from '@/domain/room/document';
import { validateRoomRules } from '@/domain/room/rules';

const ROOM_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_ROOM_ID = '22222222-2222-4222-8222-222222222222';
const ASSET_ID = '00000000-0000-4000-8000-000000000001';

function makeDocument(): RoomDocument {
  return structuredClone(WORKSPACE_SEED_V1) as RoomDocument;
}

function firstNode(document: RoomDocument): RoomNode {
  return document.nodes[0];
}

function portal(targetRoomId: string): RoomNode {
  return {
    id: 'portal-lab',
    kind: 'portal',
    targetRoomId,
    label: 'Laboratorio',
    transform: {
      position: [0, 1.2, -4.5],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
  };
}

describe('reglas de habitación', () => {
  it('rechaza un portal que apunta a la misma habitación', () => {
    const document = makeDocument();
    document.nodes.push(portal(ROOM_ID));

    const issues = validateRoomRules(document, { roomId: ROOM_ID });

    expect(issues.map((issue) => issue.code)).toContain('portal.self');
  });

  it('rechaza un portal a una habitación no publicada', () => {
    const document = makeDocument();
    document.nodes.push(portal(OTHER_ROOM_ID));

    const issues = validateRoomRules(document, {
      roomId: ROOM_ID,
      publishedRoomIds: new Set<string>(),
    });

    expect(issues.map((issue) => issue.code)).toContain('portal.unpublished');
  });

  it('rechaza un asset que no existe o no pertenece al usuario', () => {
    const document = makeDocument();
    document.nodes.push({
      id: 'asset-node',
      kind: 'asset',
      assetId: ASSET_ID,
      collider: 'auto',
      transform: {
        position: [0, 1, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
    });

    const issues = validateRoomRules(document, { assetIds: new Set<string>() });

    expect(issues.map((issue) => issue.code)).toContain('asset.missing');
  });

  it('rechaza interacción en un prefab que no la soporta', () => {
    const document = makeDocument();
    const node = firstNode(document);

    if (node.kind !== 'prefab') {
      throw new Error('La semilla debe empezar con un prefab.');
    }

    node.prefab = 'block';

    const issues = validateRoomRules(document);

    expect(issues.map((issue) => issue.code)).toContain(
      'interaction.unsupported',
    );
  });
});
