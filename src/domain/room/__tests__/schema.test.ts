import { describe, expect, it } from 'vitest';
import { WORKSPACE_SEED_V1 } from '@/content/seed/workspace-v1';
import type { RoomDocument, RoomNode } from '@/domain/room/document';
import { parseRoomDocument } from '@/domain/room/schema';

function makeDocument(): RoomDocument {
  return structuredClone(WORKSPACE_SEED_V1) as RoomDocument;
}

function firstNode(document: RoomDocument): RoomNode {
  return document.nodes[0];
}

describe('parseRoomDocument', () => {
  it('acepta la semilla de la habitación actual', () => {
    expect(() => parseRoomDocument(WORKSPACE_SEED_V1)).not.toThrow();
  });

  it('rechaza ids de nodo duplicados', () => {
    const document = makeDocument();
    document.nodes.push(structuredClone(firstNode(document)));

    expect(() => parseRoomDocument(document)).toThrow(/duplicado/);
  });

  it('rechaza un nodo fuera de los límites de la sala', () => {
    const document = makeDocument();
    firstNode(document).transform.position = [99, 1, 0];

    expect(() => parseRoomDocument(document)).toThrow();
  });

  it('rechaza enlaces que no son http o https', () => {
    const document = makeDocument();
    const node = firstNode(document);

    if (node.kind !== 'prefab' || !node.interaction) {
      throw new Error('La semilla debe tener un prefab con interacción.');
    }

    node.interaction.links = [
      { label: 'malicioso', href: 'javascript:alert(1)' },
    ];

    expect(() => parseRoomDocument(document)).toThrow();
  });

  it('rechaza más de 150 nodos', () => {
    const document = makeDocument();
    const base = firstNode(document);

    document.nodes = Array.from({ length: 151 }, (_, index) => ({
      ...structuredClone(base),
      id: `node-${index}`,
    })) as RoomDocument['nodes'];

    expect(() => parseRoomDocument(document)).toThrow();
  });

  it('rechaza un prefab que no existe en el catálogo', () => {
    const document = makeDocument();
    const node = firstNode(document);

    if (node.kind !== 'prefab') {
      throw new Error('La semilla debe empezar con un prefab.');
    }

    node.prefab = 'no-existe';
    node.prefabVersion = 1;

    expect(() => parseRoomDocument(document)).toThrow(/no existe en el catálogo/);
  });

  it('rechaza más de 8 luces', () => {
    const document = makeDocument();

    for (let index = 0; index < 9; index += 1) {
      document.nodes.push({
        id: `light-${index}`,
        kind: 'light',
        preset: 'warm',
        intensity: 1,
        transform: {
          position: [0, 2, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
      });
    }

    expect(() => parseRoomDocument(document)).toThrow(/luces/);
  });

  it('rechaza un spawn fuera de la sala', () => {
    const document = makeDocument();
    document.spawn.position = [20, 1.7, 0];

    expect(() => parseRoomDocument(document)).toThrow(/spawn/i);
  });
});
