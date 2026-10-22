import { getPrefab } from '@/domain/prefabs/catalog';
import type { RoomDocument } from '@/domain/room/document';
import type { RoomIssue } from '@/domain/room/issues';

export const ROOM_LIMITS = {
  nodes: 150,
  documentBytes: 256 * 1024,
  triangles: 300_000,
  textureBytes: 12 * 1024 * 1024,
  lights: 8,
  linksPerBlock: 5,
} as const;

export interface AssetBudgetStats {
  triangles: number;
  textureBytes: number;
  bytes?: number;
}

export interface RoomBudget {
  nodes: number;
  triangles: number;
  textureBytes: number;
  assetBytes: number;
  documentBytes: number;
}

export function estimateDocumentBytes(document: RoomDocument): number {
  return new TextEncoder().encode(JSON.stringify(document)).byteLength;
}

export function estimateRoomBudget(
  document: RoomDocument,
  assets: Readonly<Record<string, AssetBudgetStats>> = {},
): RoomBudget {
  let triangles = 0;
  let textureBytes = 0;
  let assetBytes = 0;

  for (const node of document.nodes) {
    if (node.kind === 'prefab') {
      const prefab = getPrefab(node.prefab, node.prefabVersion);

      if (prefab) {
        triangles += prefab.cost.triangles;
        textureBytes += prefab.cost.textureBytes;
      }

      continue;
    }

    if (node.kind === 'asset') {
      const stats = assets[node.assetId];

      if (stats) {
        triangles += stats.triangles;
        textureBytes += stats.textureBytes;
        assetBytes += stats.bytes ?? 0;
      }
    }
  }

  return {
    nodes: document.nodes.length,
    triangles,
    textureBytes,
    assetBytes,
    documentBytes: estimateDocumentBytes(document),
  };
}

export function validateRoomBudget(budget: RoomBudget): RoomIssue[] {
  const issues: RoomIssue[] = [];

  if (budget.nodes > ROOM_LIMITS.nodes) {
    issues.push({
      code: 'budget.nodes',
      message: `La habitación tiene ${budget.nodes} nodos; el máximo es ${ROOM_LIMITS.nodes}.`,
    });
  }

  if (budget.triangles > ROOM_LIMITS.triangles) {
    issues.push({
      code: 'budget.triangles',
      message: `La habitación suma ${budget.triangles} triángulos; el máximo es ${ROOM_LIMITS.triangles}.`,
    });
  }

  if (budget.textureBytes > ROOM_LIMITS.textureBytes) {
    issues.push({
      code: 'budget.textures',
      message: `La habitación usa ${Math.round(budget.textureBytes / (1024 * 1024))} MB de texturas; el máximo es ${Math.round(ROOM_LIMITS.textureBytes / (1024 * 1024))} MB.`,
    });
  }

  if (budget.documentBytes > ROOM_LIMITS.documentBytes) {
    issues.push({
      code: 'budget.document',
      message: `El documento pesa ${Math.round(budget.documentBytes / 1024)} KB; el máximo es ${Math.round(ROOM_LIMITS.documentBytes / 1024)} KB.`,
    });
  }

  return issues;
}
