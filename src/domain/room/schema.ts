import { z } from 'zod';
import { getPrefab } from '@/domain/prefabs/catalog';
import { estimateDocumentBytes, ROOM_LIMITS } from '@/domain/room/budgets';
import type {
  ContentBlock,
  JsonValue,
  RoomDocument,
  RoomNode,
  Vec3,
} from '@/domain/room/document';

export const NODE_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,31}$/;

const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ]),
);

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function vec3Schema(): z.ZodType<Vec3> {
  return z.tuple([z.number().finite(), z.number().finite(), z.number().finite()]);
}

const contentLinkSchema = z.object({
  label: z.string().min(1).max(40),
  href: z
    .string()
    .max(500)
    .refine(isHttpUrl, 'El enlace debe usar http o https.'),
});

const contentBlockSchema: z.ZodType<ContentBlock> = z.object({
  eyebrow: z.string().max(40),
  title: z.string().min(1).max(80),
  body: z.string().max(600),
  links: z.array(contentLinkSchema).max(ROOM_LIMITS.linksPerBlock).optional(),
});

const transformSchema = z.object({
  position: vec3Schema(),
  rotation: vec3Schema(),
  scale: z.tuple([
    z.number().min(0.05).max(20),
    z.number().min(0.05).max(20),
    z.number().min(0.05).max(20),
  ]),
});

const nodeBaseShape = {
  id: z
    .string()
    .regex(NODE_ID_PATTERN, 'El id debe ser minúsculas, números y guiones.'),
  transform: transformSchema,
  locked: z.boolean().optional(),
};

const prefabNodeSchema = z.object({
  ...nodeBaseShape,
  kind: z.literal('prefab'),
  prefab: z.string().min(1).max(64),
  prefabVersion: z.number().int().min(1).max(1_000),
  props: z.record(z.string(), jsonValueSchema).optional(),
  interaction: contentBlockSchema.optional(),
});

const assetNodeSchema = z.object({
  ...nodeBaseShape,
  kind: z.literal('asset'),
  assetId: z.string().uuid(),
  collider: z.enum(['auto', 'box', 'none']),
  interaction: contentBlockSchema.optional(),
});

const textNodeSchema = z.object({
  ...nodeBaseShape,
  kind: z.literal('text'),
  style: z.enum(['plaque', 'wall', 'floating']),
  content: contentBlockSchema,
});

const lightNodeSchema = z.object({
  ...nodeBaseShape,
  kind: z.literal('light'),
  preset: z.enum(['warm', 'cool', 'spot', 'ambient']),
  intensity: z.number().min(0).max(3),
});

const portalNodeSchema = z.object({
  ...nodeBaseShape,
  kind: z.literal('portal'),
  targetRoomId: z.string().uuid(),
  targetSpawnId: z
    .string()
    .regex(NODE_ID_PATTERN, 'El spawn destino debe usar el formato de id.')
    .optional(),
  label: z.string().min(1).max(40),
});

export const roomNodeSchema: z.ZodType<RoomNode> = z.discriminatedUnion('kind', [
  prefabNodeSchema,
  assetNodeSchema,
  textNodeSchema,
  lightNodeSchema,
  portalNodeSchema,
]);

const roomShellSchema = z.object({
  width: z.number().min(4).max(40),
  depth: z.number().min(4).max(40),
  height: z.number().min(2.4).max(12),
  floor: z.enum(['grid-blue', 'concrete', 'wood', 'metal', 'carpet', 'plaster']),
  walls: z.enum(['grid-blue', 'concrete', 'wood', 'metal', 'carpet', 'plaster']),
  ceiling: z.boolean(),
});

const spawnSchema = z.object({
  id: z.string().regex(NODE_ID_PATTERN).optional(),
  position: vec3Schema(),
  yaw: z.number().min(-Math.PI).max(Math.PI),
});

const roomMetaSchema = z.object({
  title: z.string().min(1).max(80),
  summary: z.string().max(240),
  theme: z.enum(['studio', 'gallery', 'lab', 'lounge', 'minimal']),
});

export const roomDocumentSchema: z.ZodType<RoomDocument> = z
  .object({
    schemaVersion: z.literal(1),
    meta: roomMetaSchema,
    room: roomShellSchema,
    spawn: spawnSchema,
    nodes: z.array(roomNodeSchema).min(1).max(ROOM_LIMITS.nodes),
  })
  .superRefine((document, context) => {
    const seenIds = new Set<string>();
    let lightCount = 0;

    document.nodes.forEach((node, index) => {
      if (seenIds.has(node.id)) {
        context.addIssue({
          code: 'custom',
          message: `El id "${node.id}" está duplicado.`,
          path: ['nodes', index, 'id'],
        });
      }

      seenIds.add(node.id);

      const [x, y, z] = node.transform.position;
      const maxX = document.room.width / 2 + 1;
      const maxZ = document.room.depth / 2 + 1;

      if (Math.abs(x) > maxX || Math.abs(z) > maxZ || y < -1 || y > document.room.height + 2) {
        context.addIssue({
          code: 'custom',
          message: `El nodo "${node.id}" está fuera de los límites de la sala.`,
          path: ['nodes', index, 'transform', 'position'],
        });
      }

      if (node.kind === 'light') {
        lightCount += 1;
      }

      if (
        node.kind === 'prefab' &&
        !getPrefab(node.prefab, node.prefabVersion)
      ) {
        context.addIssue({
          code: 'custom',
          message: `El prefab "${node.prefab}@${node.prefabVersion}" no existe en el catálogo.`,
          path: ['nodes', index, 'prefab'],
        });
      }
    });

    if (lightCount > ROOM_LIMITS.lights) {
      context.addIssue({
        code: 'custom',
        message: `La habitación tiene ${lightCount} luces; el máximo es ${ROOM_LIMITS.lights}.`,
        path: ['nodes'],
      });
    }

    const [spawnX, spawnY, spawnZ] = document.spawn.position;

    if (
      Math.abs(spawnX) > document.room.width / 2 ||
      Math.abs(spawnZ) > document.room.depth / 2 ||
      spawnY < 1.6 ||
      spawnY > 1.9
    ) {
      context.addIssue({
        code: 'custom',
        message: 'El spawn debe estar dentro de la sala y a altura de ojos (1,6–1,9 m).',
        path: ['spawn', 'position'],
      });
    }
  });

export class RoomDocumentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RoomDocumentError';
  }
}

export function parseRoomDocument(input: unknown): RoomDocument {
  const document = roomDocumentSchema.parse(input);
  const bytes = estimateDocumentBytes(document);

  if (bytes > ROOM_LIMITS.documentBytes) {
    throw new RoomDocumentError(
      `El documento pesa ${Math.round(bytes / 1024)} KB; el máximo es ${Math.round(ROOM_LIMITS.documentBytes / 1024)} KB.`,
    );
  }

  return document;
}
