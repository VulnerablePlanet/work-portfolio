import type {
  AssetNode,
  PrefabNode,
  RoomDocument,
} from '@/domain/room/document';

export type InteractiveRoomNode = PrefabNode | AssetNode;

function isInteractiveNode(
  node: RoomDocument['nodes'][number],
): node is InteractiveRoomNode {
  return (
    (node.kind === 'prefab' || node.kind === 'asset') &&
    node.interaction !== undefined
  );
}

export function getInteractiveNodes(
  document: RoomDocument,
): InteractiveRoomNode[] {
  return document.nodes.filter(isInteractiveNode);
}
