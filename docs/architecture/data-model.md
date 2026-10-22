# Modelo de datos

- Estado: vigente (diseño)
- Fecha: 2026-10-22
- Relacionado: [ADR-002](../adr/002-espacio-habitacion-portal.md), [ADR-004](../adr/004-assets-y-colisionadores.md), [ADR-006](../adr/006-registro-abierto.md)

Este documento describe el esquema objetivo. La implementación vivirá en migraciones SQL versionadas (`supabase/migrations/`). Los tipos y límites del documento de habitación están en [room-document-v1.md](room-document-v1.md).

## 1. Relaciones

```text
auth.users 1──1 profiles
profiles   1──N spaces
spaces     1──N rooms
rooms      1──N room_versions
rooms      N──1 room_versions (published_version_id)
profiles   1──N assets
assets     1──N asset_jobs
rooms      1──N reports
profiles   1──N moderation_actions
profiles   1──1 quotas
```

## 2. Tablas

```sql
create extension if not exists citext;
create extension if not exists pgcrypto;
```

`spaces.spawn_room_id` y `rooms.published_version_id` son claves foráneas circulares: se añaden con `alter table` después de crear `rooms` y `room_versions`, respectivamente.

### 2.1 profiles

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | FK a `auth.users(id)` `on delete cascade` |
| `handle` | citext unique | 3–30, `^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$`, reservados bloqueados |
| `display_name` | text | 1–80 |
| `headline` | text | 0–120 |
| `avatar_url` | text | opcional |
| `role` | text | `user` \| `admin`, default `user` |
| `created_at` | timestamptz | default `now()` |

### 2.2 spaces

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `owner_id` | uuid | FK profiles, cascade |
| `slug` | citext | único por owner |
| `title` | text | 1–80 |
| `summary` | text | 0–240 |
| `theme` | text | `studio` \| `gallery` \| `lab` \| `lounge` \| `minimal` |
| `is_default` | boolean | default true; índice único parcial por owner |
| `spawn_room_id` | uuid | FK rooms, `on delete set null` |
| `revision` | int | default 1 |
| `published_manifest` | jsonb | snapshot del espacio |
| `published_at` | timestamptz | |
| `created_at`, `updated_at` | timestamptz | |

### 2.3 rooms

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `space_id` | uuid | FK spaces, cascade |
| `owner_id` | uuid | FK profiles, cascade (desnormalizado para RLS y consultas) |
| `slug` | citext | único por space |
| `title` | text | 1–80 |
| `purpose` | text | `about` \| `projects` \| `skills` \| `contact` \| `lab` \| `custom` |
| `draft` | jsonb | documento de trabajo |
| `revision` | int | concurrencia optimista |
| `published_version_id` | uuid | FK room_versions, `on delete set null` |
| `visibility` | text | `draft` \| `unlisted` \| `published` \| `suspended` |
| `created_at`, `updated_at` | timestamptz | |

### 2.4 room_versions

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `room_id` | uuid | FK rooms, cascade |
| `version` | int | monotónica por room; única |
| `document_key` | text | clave R2 del snapshot inmutable |
| `stats` | jsonb | nodos, triángulos, texturas, bytes, advertencias |
| `created_by` | uuid | FK profiles |
| `created_at` | timestamptz | |

El documento **publicado** no se guarda en Postgres. Solo metadata y clave de R2. Esto evita que el historial consuma los 500 MB del plan gratuito. El borrador sí vive en `rooms.draft` porque necesita escritura frecuente y control de revisión.

### 2.5 assets

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `owner_id` | uuid | FK profiles, cascade |
| `kind` | text | `glb` \| `image` \| `relief` |
| `status` | text | `pending` \| `ready` \| `failed` |
| `storage_key` | text | objeto público procesado |
| `original_key` | text | objeto privado original |
| `thumbnail_key` | text | |
| `bytes` | bigint | peso del procesado |
| `triangles` | int | |
| `bounds` | jsonb | `{min:[x,y,z], max:[x,y,z]}` |
| `collider` | jsonb | `{type:'box'|'convex', ...}` |
| `license` | text | declarada/verificada |
| `model` | text | modelo usado si es L1/L2 |
| `source` | text | `upload` \| `relief` \| `generated` |
| `created_at` | timestamptz | |

### 2.6 asset_jobs

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `owner_id` | uuid | FK profiles, cascade |
| `asset_id` | uuid | FK assets, cascade, nullable |
| `kind` | text | `relief` \| `optimize` \| `validate` |
| `status` | text | `queued` \| `running` \| `ready` \| `failed` \| `cancelled` |
| `provider` | text | `client` \| `local-gpu` \| `replicate` \| … |
| `attempts` | int | default 0 |
| `error` | text | saneado |
| `created_at`, `finished_at` | timestamptz | |

### 2.7 reports y moderation_actions

| reports | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `room_id` | uuid | FK rooms |
| `reporter_id` | uuid | FK profiles, `on delete set null` |
| `reason` | text | `spam` \| `harassment` \| `sexual` \| `violence` \| `copyright` \| `other` |
| `details` | text | ≤ 500 |
| `status` | text | `open` \| `actioned` \| `dismissed` |
| `created_at`, `resolved_at` | timestamptz | |

| moderation_actions | Tipo | Notas |
|---|---|---|
| `id` | bigserial PK | |
| `room_id` | uuid | FK rooms |
| `actor_id` | uuid | FK profiles |
| `action` | text | `hide` \| `restore` \| `suspend` \| `delete` |
| `notes` | text | |
| `created_at` | timestamptz | |

### 2.8 quotas

| Columna | Tipo | Notas |
|---|---|---|
| `owner_id` | uuid PK | FK profiles |
| `asset_bytes` | bigint | suma de assets `ready` |
| `asset_count` | int | |
| `room_count` | int | |
| `updated_at` | timestamptz | |

Los contadores se actualizan con triggers en `assets` y `rooms`; un job periódico los reconcilia. Si divergen, manda el cálculo agregado.

## 3. Índices

```sql
create unique index spaces_owner_default_idx on public.spaces(owner_id) where is_default;
create unique index spaces_slug_idx on public.spaces(owner_id, slug);
create unique index rooms_slug_idx on public.rooms(space_id, slug);
create index rooms_owner_idx on public.rooms(owner_id);
create index rooms_space_idx on public.rooms(space_id);
create unique index room_versions_version_idx on public.room_versions(room_id, version);
create index assets_owner_idx on public.assets(owner_id, created_at desc);
create index asset_jobs_status_idx on public.asset_jobs(status, created_at);
create index reports_status_idx on public.reports(status, created_at);
```

## 4. RLS y modelo de escritura

**Modelo:** el cliente **no escribe tablas directamente**. Todas las mutaciones pasan por acciones del Worker (`/api/*`), que validan y usan `service_role`. RLS protege las lecturas y actúa como defensa en profundidad si PostgREST quedara expuesto.

```sql
alter table public.profiles enable row level security;
alter table public.spaces enable row level security;
alter table public.rooms enable row level security;
alter table public.room_versions enable row level security;
alter table public.assets enable row level security;
alter table public.asset_jobs enable row level security;
alter table public.reports enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.quotas enable row level security;

-- Perfiles: lectura pública
create policy profiles_read on public.profiles for select using (true);

-- Espacios: visibles si tienen alguna habitación visible; el dueño ve el suyo
create policy spaces_read on public.spaces for select using (
  owner_id = auth.uid()
  or exists (
    select 1 from public.rooms r
    where r.space_id = spaces.id and r.visibility in ('published', 'unlisted')
  )
);

-- Habitaciones: publicadas o unlisted son públicas; el dueño ve sus borradores
create policy rooms_read on public.rooms for select using (
  owner_id = auth.uid() or visibility in ('published', 'unlisted')
);

-- Versiones: la publicada es pública; el dueño ve su historial
create policy versions_read on public.room_versions for select using (
  exists (
    select 1 from public.rooms r
    where r.id = room_versions.room_id
      and (r.owner_id = auth.uid() or r.published_version_id = room_versions.id)
  )
);

-- Assets: los procesados son visibles; el dueño ve los suyos
create policy assets_read on public.assets for select using (
  owner_id = auth.uid() or status = 'ready'
);

-- Jobs: solo el dueño los consulta (creación y ejecución en el servidor)
create policy jobs_read on public.asset_jobs for select using (owner_id = auth.uid());
```

No se definen políticas de `INSERT`, `UPDATE` ni `DELETE`: `service_role` las omite y el servidor es el único escritor.

**Lecturas:** el perfil público usa la clave anónima (RLS aplica); el dueño usa su JWT (RLS aplica); el servidor puede usar `service_role` para tareas internas. **Escrituras:** solo el Worker con `service_role`, después de validar sesión, payload, propiedad y cuotas.

### Por qué

| Riesgo | Cómo lo evita |
|---|---|
| Falsificar `published_version_id` o `visibility` | Solo `publish_room` (security definer) los cambia |
| Fabricar versiones sin validar el documento | No hay política de insert en `room_versions` |
| Marcar un asset como `ready` sin validación | `assets.status` solo lo cambia el servidor |
| Escalada a `admin` | `profiles.role` no se puede actualizar desde el cliente |
| Inserción directa de reportes o jobs | Solo el servidor escribe; no hay políticas de escritura |
| Saltarse cuotas | Las cuotas se validan en la acción antes de escribir |

### Si en el futuro se escribe desde el cliente

Por ejemplo, autosave directo a PostgREST. Antes de hacerlo:

1. Añadir políticas de escritura por tabla y probar escalada de privilegios.
2. Proteger columnas críticas (`role`, `published_version_id`, `visibility`, `status`) con columnas revocadas o triggers.
3. Volver a ejecutar la matriz de pruebas de RLS.

No se hace en v1: la validación centralizada vale más que el ahorro de un salto de red.

**Nota:** la clave `service_role` nunca se expone al cliente. Las operaciones administrativas y los jobs usan el servidor.

## 5. Publicación transaccional

```sql
create or replace function public.build_manifest(p_space_id uuid)
returns jsonb language sql stable security definer
set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'schemaVersion', 1,
    'generatedAt', now(),
    'spawnRoomId', (select s.spawn_room_id from public.spaces s where s.id = p_space_id),
    'rooms', coalesce((
      select jsonb_agg(jsonb_build_object(
        'roomId', r.id,
        'slug', r.slug,
        'title', r.title,
        'purpose', r.purpose,
        'versionId', v.id,
        'version', v.version,
        'r2Key', v.document_key
      ) order by r.created_at)
      from public.rooms r
      join public.room_versions v on v.id = r.published_version_id
      where r.space_id = p_space_id and r.visibility in ('published', 'unlisted')
    ), '[]'::jsonb)
  );
$$;

create or replace function public.publish_room(
  p_room_id uuid,
  p_owner_id uuid,
  p_document_key text,
  p_stats jsonb
) returns uuid language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  v_room public.rooms%rowtype;
  v_version_id uuid;
  v_version int;
  v_visibility text;
begin
  select * into v_room from public.rooms where id = p_room_id for update;
  if not found then raise exception 'room_not_found'; end if;
  if v_room.owner_id <> p_owner_id then raise exception 'not_owner'; end if;

  select coalesce(max(version), 0) + 1 into v_version
    from public.room_versions where room_id = p_room_id;

  v_visibility := case
    when v_room.visibility in ('published', 'unlisted') then v_room.visibility
    else 'unlisted'
  end;

  insert into public.room_versions (room_id, version, document_key, stats, created_by)
  values (p_room_id, v_version, p_document_key, p_stats, p_owner_id)
  returning id into v_version_id;

  update public.rooms
     set published_version_id = v_version_id, visibility = v_visibility, updated_at = now()
   where id = p_room_id;

  update public.spaces
     set published_manifest = public.build_manifest(v_room.space_id),
         published_at = now(),
         revision = revision + 1,
         updated_at = now()
   where id = v_room.space_id;

  return v_version_id;
end;
$$;
```

La validación del documento y de los portales ocurre **antes** de llamar a la función, en el servidor (Zod + reglas). La función solo garantiza atomicidad y propiedad.

**Permisos de las funciones:** `build_manifest` y `publish_room` se revocan de `public`, `anon` y `authenticated`, y se conceden solo a `service_role`. El Worker invoca `publish_room` después de verificar la sesión y pasar el `owner_id` autenticado. No se usa `auth.uid()` dentro de las funciones porque la conexión de servicio no lleva el JWT del usuario.

## 6. Concurrencia y guardado

```sql
update public.rooms
   set draft = $1, revision = revision + 1, updated_at = now()
 where id = $2 and revision = $3 and owner_id = $4;
-- 0 filas → 409 conflicto de revisión
```

`$4` es el `owner_id` autenticado que pasa el Worker tras verificar la sesión. No se usa `auth.uid()` en la conexión de servicio.

- El editor reenvía con la revisión actual o muestra "hay cambios en otra pestaña".
- El autosave se debouncea (5–10 s) y solo se ejecuta si el documento cambió.
- Los borradores no se cachean.

## 7. Layout de R2

```text
originals/{ownerId}/{assetId}/source.{ext}          privado
assets/{assetId}/model.glb                          público, inmutable
assets/{assetId}/thumb.webp                         público, inmutable
spaces/{spaceId}/rooms/{roomId}/{version}.json       público, inmutable
spaces/{spaceId}/manifest.json                      público, se reescribe
spaces/{spaceId}/og/{roomId}-{version}.webp         público, inmutable
```

- Los objetos públicos llevan `Cache-Control: public, max-age=31536000, immutable` (la clave incluye versión).
- El manifiesto se reescribe en cada publish y se sirve con TTL corto.
- `spaces.published_manifest` es la fuente de verdad del snapshot; el `manifest.json` de R2 es una copia de entrega para lectura y caché. Se escriben en la misma operación; si discrepan, manda la base de datos y el siguiente publish corrige R2.
- Los originales privados solo se sirven con URL firmada de corta duración al dueño.

## 8. Ciclo de vida y borrado

| Evento | Acción |
|---|---|
| Borrar asset no referenciado | Borrar objetos de R2 y fila |
| Borrar habitación | Borrar versiones y snapshots de R2 |
| Despublicar | `visibility='draft'`, recalcular manifiesto, purgar caché |
| Suspender | `visibility='suspended'`, `noindex`, recalcular manifiesto |
| Borrar cuenta | Cascada DB + borrado por prefijo `originals/{ownerId}/` y assets del owner; anonimizar reportes |
| Assets huérfanos | Job diario: `failed` o sin referencia > 30 días → borrar |
| Reportes resueltos | Retención 1 año; luego agregados |

## 9. Capacidad estimada

| Recurso | Cálculo | Límite free | Lectura |
|---|---|---|---|
| DB | ~10 KB por borrador (TOAST) × 5 habitaciones × 2.000 usuarios ≈ 100 MB | 500 MB | Holgado |
| Versiones | En R2, no en DB | — | Sin presión sobre DB |
| R2 | ~5 MB por usuario real × 2.000 ≈ 10 GB | 10 GB | En el límite; optimización y cuotas mandan |
| Egress | Perfiles y manifiestos por Supabase; assets por R2 | 5 GB | Bajo si se cachea |
| Workers | 100k/día; perfiles cacheados | 100k | Vigilar a partir de 50k/día |

Umbrales de acción: R2 > 7 GB, DB > 350 MB, Workers > 50k/día, tasa de fallos de jobs > 5%.

## 10. Migraciones

- Archivos SQL con timestamp en `supabase/migrations/`.
- Estrategia expand/contract: añadir columnas/tablas, desplegar código compatible, migrar datos, eliminar lo viejo.
- Nunca destructivas en el mismo despliegue que las usa.
- Backups: en free tier no hay backups automáticos; exportar semanalmente a R2 (script de `pg_dump`) mientras el proyecto esté en free.
- Las migraciones de datos del documento (`RoomDocument`) son independientes y viven en el dominio ([room-document-v1.md](room-document-v1.md)).
