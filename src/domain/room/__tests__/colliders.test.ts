import { describe, expect, it } from 'vitest';
import { WORKSPACE_SEED_V1 } from '@/content/seed/workspace-v1';
import type { RoomDocument } from '@/domain/room/document';
import { resolveRoomColliders } from '@/domain/room/colliders';

function makeDocument(): RoomDocument {
  return structuredClone(WORKSPACE_SEED_V1) as RoomDocument;
}

describe('colisionadores de la habitación', () => {
  it('deriva suelo, paredes y prefabs de la semilla', () => {
    const colliders = resolveRoomColliders(WORKSPACE_SEED_V1);

    expect(colliders).toHaveLength(9);
    expect(colliders.find((collider) => collider.id === 'room:floor')).toMatchObject({
      position: [0, -0.1, 0],
      size: [10, 0.2, 10],
    });
    expect(
      colliders.find((collider) => collider.id === 'node:workspace-block'),
    ).toMatchObject({
      position: [-2, 0.6, -1.4],
      size: [2.4, 1.2, 1.1],
    });
  });

  it('aplica la escala del nodo al colisionador', () => {
    const document = makeDocument();
    const consoleNode = document.nodes.find(
      (node) => node.id === 'architecture-console',
    );

    if (!consoleNode) {
      throw new Error('Falta el nodo de la consola.');
    }

    consoleNode.transform.scale = [2, 1, 1];

    const collider = resolveRoomColliders(document).find(
      (candidate) => candidate.id === 'node:architecture-console',
    );

    expect(collider?.size).toEqual([2.4, 1.5, 0.8]);
  });

  it('ignora prefabs sin caja de colisión y assets', () => {
    const document = makeDocument();
    document.nodes.push({
      id: 'asset-node',
      kind: 'asset',
      assetId: '00000000-0000-4000-8000-000000000001',
      collider: 'auto',
      transform: {
        position: [0, 1, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
    });

    expect(resolveRoomColliders(document)).toHaveLength(9);
  });
});
