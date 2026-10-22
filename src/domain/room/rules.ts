import { getPrefab } from '@/domain/prefabs/catalog';
import type { RoomDocument } from '@/domain/room/document';
import type { RoomIssue } from '@/domain/room/issues';

export interface RoomRulesContext {
  /** Id de la habitación que se está validando; permite detectar portales a sí misma. */
  roomId?: string;
  /** Assets disponibles del dueño. Si se omite, no se valida la referencia. */
  assetIds?: ReadonlySet<string>;
  /** Habitaciones publicadas del espacio. Si se omite, no se valida el destino del portal. */
  publishedRoomIds?: ReadonlySet<string>;
}

export function validateRoomRules(
  document: RoomDocument,
  context: RoomRulesContext = {},
): RoomIssue[] {
  const issues: RoomIssue[] = [];

  for (const node of document.nodes) {
    if (node.kind === 'portal') {
      if (context.roomId && node.targetRoomId === context.roomId) {
        issues.push({
          code: 'portal.self',
          message: 'Un portal no puede apuntar a su propia habitación.',
          nodeId: node.id,
        });
      }

      if (
        context.publishedRoomIds &&
        !context.publishedRoomIds.has(node.targetRoomId)
      ) {
        issues.push({
          code: 'portal.unpublished',
          message: `La habitación destino del portal "${node.label}" no está publicada.`,
          nodeId: node.id,
        });
      }
    }

    if (node.kind === 'asset') {
      if (context.assetIds && !context.assetIds.has(node.assetId)) {
        issues.push({
          code: 'asset.missing',
          message: `El asset "${node.assetId}" no existe o no pertenece al usuario.`,
          nodeId: node.id,
        });
      }
    }

    if (node.kind === 'prefab' && node.interaction) {
      const prefab = getPrefab(node.prefab, node.prefabVersion);

      if (prefab && !prefab.supportsInteraction) {
        issues.push({
          code: 'interaction.unsupported',
          message: `El prefab "${prefab.id}" no admite contenido interactivo.`,
          nodeId: node.id,
        });
      }
    }
  }

  return issues;
}
