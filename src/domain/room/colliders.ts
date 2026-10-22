import { getPrefab } from '@/domain/prefabs/catalog';
import type { RoomDocument, Vec3 } from '@/domain/room/document';

export interface RoomBoxCollider {
  id: string;
  position: Vec3;
  rotation: Vec3;
  size: Vec3;
}

const WALL_THICKNESS = 0.2;
const FLOOR_THICKNESS = 0.2;

/**
 * Deriva las cajas de colisión de la sala y de sus prefabs.
 * Es una función pura para poder probarla sin Rapier ni DOM.
 */
export function resolveRoomColliders(
  document: RoomDocument,
): RoomBoxCollider[] {
  const { width, depth, height } = document.room;
  const colliders: RoomBoxCollider[] = [
    {
      id: 'room:floor',
      position: [0, -FLOOR_THICKNESS / 2, 0],
      rotation: [0, 0, 0],
      size: [width, FLOOR_THICKNESS, depth],
    },
    {
      id: 'room:wall-back',
      position: [0, height / 2, -depth / 2],
      rotation: [0, 0, 0],
      size: [width, height, WALL_THICKNESS],
    },
    {
      id: 'room:wall-front',
      position: [0, height / 2, depth / 2],
      rotation: [0, 0, 0],
      size: [width, height, WALL_THICKNESS],
    },
    {
      id: 'room:wall-left',
      position: [-width / 2, height / 2, 0],
      rotation: [0, 0, 0],
      size: [WALL_THICKNESS, height, depth],
    },
    {
      id: 'room:wall-right',
      position: [width / 2, height / 2, 0],
      rotation: [0, 0, 0],
      size: [WALL_THICKNESS, height, depth],
    },
  ];

  for (const node of document.nodes) {
    if (node.kind !== 'prefab') {
      continue;
    }

    const prefab = getPrefab(node.prefab, node.prefabVersion);

    if (!prefab || prefab.collider.type !== 'box') {
      continue;
    }

    const [scaleX, scaleY, scaleZ] = node.transform.scale;
    const [width_, height_, depth_] = prefab.collider.size;

    colliders.push({
      id: `node:${node.id}`,
      position: [
        node.transform.position[0],
        node.transform.position[1],
        node.transform.position[2],
      ],
      rotation: [
        node.transform.rotation[0],
        node.transform.rotation[1],
        node.transform.rotation[2],
      ],
      size: [width_ * scaleX, height_ * scaleY, depth_ * scaleZ],
    });
  }

  return colliders;
}
