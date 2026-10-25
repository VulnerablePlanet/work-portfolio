import type { AppLoadContext } from 'react-router';
import { DEMO_HANDLE, DEMO_SPACE } from '@/content/seed/demo-space';
import type { RoomDocument } from '@/domain/room/document';
import { estimateRoomBudget } from '@/domain/room/budgets';
import { parseRoomDocument } from '@/domain/room/schema';
import { validateRoomDocument } from '@/domain/room/validation';
import type { PublicRoom, PublicSpace, RoomPurpose } from '@/lib/public-space';
import { createSupabaseServerClient } from '@/lib/supabase.server';

const PURPOSES = new Set<RoomPurpose>([
  'about',
  'projects',
  'skills',
  'contact',
  'lab',
  'custom',
]);

interface ManifestRoom {
  roomId: string;
  slug: string;
  title: string;
  purpose: string;
  versionId: string;
  version: number;
  r2Key: string;
}

interface SpaceManifest {
  rooms: ManifestRoom[];
}

function isManifestRoom(value: unknown): value is ManifestRoom {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const room = value as Record<string, unknown>;

  return (
    typeof room.roomId === 'string' &&
    typeof room.slug === 'string' &&
    typeof room.title === 'string' &&
    typeof room.r2Key === 'string'
  );
}

function parseManifest(value: unknown): SpaceManifest | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const rooms = (value as { rooms?: unknown }).rooms;

  if (!Array.isArray(rooms)) {
    return null;
  }

  return { rooms: rooms.filter(isManifestRoom) };
}

function loadPurpose(value: string): RoomPurpose {
  return PURPOSES.has(value as RoomPurpose) ? (value as RoomPurpose) : 'custom';
}

async function loadPublishedRooms(
  context: AppLoadContext,
  manifest: SpaceManifest | null,
): Promise<PublicRoom[]> {
  const bucket = context.cloudflare.env.ROOM_SNAPSHOTS;

  if (!bucket || !manifest) {
    return [];
  }

  const rooms: PublicRoom[] = [];

  for (const entry of manifest.rooms) {
    const object = await bucket.get(entry.r2Key);

    if (!object) {
      continue;
    }

    try {
      const document = parseRoomDocument(JSON.parse(await object.text()));
      rooms.push({
        slug: entry.slug,
        title: entry.title,
        purpose: loadPurpose(entry.purpose),
        document,
      });
    } catch (error) {
      console.warn(`[rooms] snapshot inválido para ${entry.slug}`, error);
    }
  }

  return rooms;
}

/**
 * Perfil público de un espacio. Con Supabase configurado lee el manifiesto
 * publicado y los documentos de R2; sin backend, el handle "demo" usa la
 * semilla local.
 */
export async function loadPublicSpace(
  request: Request,
  context: AppLoadContext,
  handle: string,
): Promise<PublicSpace | null> {
  const supabase = createSupabaseServerClient(request, context);

  if (!supabase) {
    return handle === DEMO_HANDLE ? DEMO_SPACE : null;
  }

  const { data: profile, error: profileError } = await supabase.client
    .from('profiles')
    .select('id, handle, display_name, headline')
    .eq('handle', handle)
    .maybeSingle();

  if (profileError) {
    throw new Response('No se pudo cargar el perfil', { status: 500 });
  }

  if (!profile) {
    return handle === DEMO_HANDLE ? DEMO_SPACE : null;
  }

  const { data: space, error: spaceError } = await supabase.client
    .from('spaces')
    .select('id, title, summary, published_manifest')
    .eq('owner_id', profile.id)
    .eq('is_default', true)
    .maybeSingle();

  if (spaceError) {
    throw new Response('No se pudo cargar el espacio', { status: 500 });
  }

  if (!space) {
    return {
      handle: String(profile.handle),
      displayName: String(profile.display_name),
      headline: String(profile.headline ?? ''),
      title: 'Mi espacio',
      summary: '',
      rooms: [],
    };
  }

  const rooms = await loadPublishedRooms(
    context,
    parseManifest(space.published_manifest),
  );

  if (rooms.length === 0 && handle === DEMO_HANDLE) {
    return DEMO_SPACE;
  }

  return {
    handle: String(profile.handle),
    displayName: String(profile.display_name),
    headline: String(profile.headline ?? ''),
    title: String(space.title),
    summary: String(space.summary ?? ''),
    rooms,
  };
}

export async function loadPublicRoom(
  request: Request,
  context: AppLoadContext,
  handle: string,
  roomSlug: string,
): Promise<{ space: PublicSpace; room: PublicRoom } | null> {
  const space = await loadPublicSpace(request, context, handle);

  if (!space) {
    return null;
  }

  const room = space.rooms.find((candidate) => candidate.slug === roomSlug);

  return room ? { space, room } : null;
}

export async function loadRoomDocument(
  request: Request,
  context: AppLoadContext,
  handle: string,
  roomSlug: string,
): Promise<RoomDocument | null> {
  const result = await loadPublicRoom(request, context, handle, roomSlug);

  return result?.room.document ?? null;
}

export interface PublishResult {
  versionId: string;
  key: string;
}

/**
 * Publica un borrador validado: escribe el snapshot en R2 y llama a la RPC
 * transaccional que crea la versión y actualiza el manifiesto.
 */
export async function publishRoom(
  request: Request,
  context: AppLoadContext,
  roomId: string,
  document: unknown,
): Promise<PublishResult> {
  const supabase = createSupabaseServerClient(request, context);

  if (!supabase) {
    throw new Error('Supabase no está configurado.');
  }

  const {
    data: { user },
  } = await supabase.client.auth.getUser();

  if (!user) {
    throw new Error('Se necesita una sesión para publicar.');
  }

  const { data: room, error: roomError } = await supabase.client
    .from('rooms')
    .select('id, space_id, owner_id')
    .eq('id', roomId)
    .maybeSingle();

  if (roomError || !room) {
    throw new Error('La habitación no existe.');
  }

  if (room.owner_id !== user.id) {
    throw new Error('No eres el propietario de esta habitación.');
  }

  const parsed = parseRoomDocument(document);
  const assetNodeIds = parsed.nodes
    .filter((node) => node.kind === 'asset')
    .map((node) => node.assetId);
  const assetStats: Record<
    string,
    { triangles: number; textureBytes: number; bytes: number }
  > = {};
  let ownedAssetIds: ReadonlySet<string> | undefined;

  if (assetNodeIds.length > 0) {
    const { data: assetsData, error: assetsError } = await supabase.client
      .from('assets')
      .select('id, triangles, bytes')
      .eq('owner_id', user.id)
      .in('id', assetNodeIds);

    if (assetsError) {
      throw new Error(
        `No se pudieron validar los assets: ${assetsError.message}`,
      );
    }

    const assets = (assetsData ?? []) as {
      id: string;
      triangles: number | null;
      bytes: number | null;
    }[];

    ownedAssetIds = new Set(assets.map((asset) => String(asset.id)));

    for (const asset of assets) {
      assetStats[String(asset.id)] = {
        triangles: Number(asset.triangles ?? 0),
        textureBytes: 0,
        bytes: Number(asset.bytes ?? 0),
      };
    }
  }

  const { data: publishedRoomsData, error: publishedError } =
    await supabase.client
      .from('rooms')
      .select('id')
      .eq('space_id', room.space_id)
      .in('visibility', ['published', 'unlisted']);

  if (publishedError) {
    throw new Error(
      `No se pudieron validar los portales: ${publishedError.message}`,
    );
  }

  const publishedRoomIds = new Set(
    ((publishedRoomsData ?? []) as { id: string }[]).map((item) =>
      String(item.id),
    ),
  );
  const validation = validateRoomDocument(document, {
    roomId,
    assetIds: ownedAssetIds,
    publishedRoomIds,
  });

  if (validation.issues.length > 0) {
    throw new Error(validation.issues.map((issue) => issue.message).join(' '));
  }

  const bucket = context.cloudflare.env.ROOM_SNAPSHOTS;

  if (!bucket) {
    throw new Error('R2 no está configurado para snapshots.');
  }

  const key = `spaces/${room.space_id}/rooms/${roomId}/${crypto.randomUUID()}.json`;
  await bucket.put(key, JSON.stringify(validation.document), {
    httpMetadata: { contentType: 'application/json' },
  });

  const stats = estimateRoomBudget(validation.document, assetStats);
  const { data, error } = await supabase.client.rpc('publish_room', {
    p_room_id: roomId,
    p_owner_id: user.id,
    p_document_key: key,
    p_stats: stats,
  });

  if (error) {
    throw new Error(`No se pudo publicar: ${error.message}`);
  }

  return { versionId: String(data), key };
}
