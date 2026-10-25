-- M1b: esquema inicial de la plataforma.
-- Aplicar con Supabase CLI (`supabase db push`) o psql.

create extension if not exists citext;
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Perfiles y espacios
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle citext not null unique,
  display_name text not null,
  headline text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_handle_format
    check (handle ~ '^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$')
);

create table if not exists public.spaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  slug citext not null,
  title text not null,
  summary text,
  theme text not null default 'studio'
    check (theme in ('studio', 'gallery', 'lab', 'lounge', 'minimal')),
  is_default boolean not null default true,
  spawn_room_id uuid,
  revision integer not null default 1,
  published_manifest jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, slug)
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  slug citext not null,
  title text not null,
  purpose text not null default 'custom'
    check (purpose in ('about', 'projects', 'skills', 'contact', 'lab', 'custom')),
  draft jsonb not null default '{}'::jsonb,
  revision integer not null default 1,
  published_version_id uuid,
  visibility text not null default 'draft'
    check (visibility in ('draft', 'unlisted', 'published', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (space_id, slug)
);

create table if not exists public.room_versions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  version integer not null,
  document_key text not null,
  stats jsonb not null default '{}'::jsonb,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (room_id, version)
);

alter table public.spaces
  add constraint spaces_spawn_room_fk
  foreign key (spawn_room_id) references public.rooms (id) on delete set null;

alter table public.rooms
  add constraint rooms_published_version_fk
  foreign key (published_version_id) references public.room_versions (id)
  on delete set null;

-- ---------------------------------------------------------------------------
-- Assets, jobs, moderación y cuotas
-- ---------------------------------------------------------------------------

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('glb', 'image', 'relief')),
  status text not null default 'pending'
    check (status in ('pending', 'ready', 'failed')),
  storage_key text not null,
  original_key text,
  thumbnail_key text,
  bytes bigint not null default 0,
  triangles integer,
  bounds jsonb,
  collider jsonb,
  license text,
  model text,
  source text not null default 'upload'
    check (source in ('upload', 'relief', 'generated')),
  created_at timestamptz not null default now()
);

create table if not exists public.asset_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  asset_id uuid references public.assets (id) on delete cascade,
  kind text not null check (kind in ('relief', 'optimize', 'validate')),
  status text not null default 'queued'
    check (status in ('queued', 'running', 'ready', 'failed', 'cancelled')),
  provider text,
  attempts integer not null default 0,
  error text,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  reporter_id uuid references public.profiles (id) on delete set null,
  reason text not null
    check (reason in ('spam', 'harassment', 'sexual', 'violence', 'copyright', 'other')),
  details text,
  status text not null default 'open'
    check (status in ('open', 'actioned', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles (id) on delete set null
);

create table if not exists public.moderation_actions (
  id bigserial primary key,
  room_id uuid references public.rooms (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null check (action in ('hide', 'restore', 'suspend', 'delete')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.quotas (
  owner_id uuid primary key references public.profiles (id) on delete cascade,
  asset_bytes bigint not null default 0,
  asset_count integer not null default 0,
  room_count integer not null default 0,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------------

create unique index if not exists spaces_owner_default_idx
  on public.spaces (owner_id) where is_default;
create unique index if not exists spaces_slug_idx
  on public.spaces (owner_id, slug);
create unique index if not exists rooms_slug_idx
  on public.rooms (space_id, slug);
create index if not exists rooms_owner_idx on public.rooms (owner_id);
create index if not exists rooms_space_idx on public.rooms (space_id);
create unique index if not exists room_versions_version_idx
  on public.room_versions (room_id, version);
create index if not exists assets_owner_idx
  on public.assets (owner_id, created_at desc);
create index if not exists asset_jobs_status_idx
  on public.asset_jobs (status, created_at);
create index if not exists reports_status_idx
  on public.reports (status, created_at);

-- ---------------------------------------------------------------------------
-- Triggers de perfiles y actualización
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  base_handle text;
  candidate text;
  suffix integer := 0;
begin
  base_handle := lower(coalesce(
    new.raw_user_meta_data ->> 'handle',
    split_part(coalesce(new.email, 'user'), '@', 1)
  ));
  base_handle := regexp_replace(base_handle, '[^a-z0-9-]', '-', 'g');
  base_handle := trim(both '-' from base_handle);

  if length(base_handle) < 3 then
    base_handle := 'user-' || substr(new.id::text, 1, 8);
  end if;

  candidate := left(base_handle, 30);

  while exists (select 1 from public.profiles where handle = candidate) loop
    suffix := suffix + 1;
    candidate := left(base_handle, 26) || '-' || suffix;
  end loop;

  insert into public.profiles (id, handle, display_name)
  values (
    new.id,
    candidate,
    coalesce(new.raw_user_meta_data ->> 'display_name', candidate)
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_new_profile()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.spaces (owner_id, slug, title, summary, is_default)
  values (
    new.id,
    'workspace',
    coalesce(new.display_name, 'Mi espacio'),
    'Espacio de trabajo personal',
    true
  )
  on conflict do nothing;

  insert into public.quotas (owner_id) values (new.id) on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_profile_created on public.profiles;
create trigger on_profile_created
  after insert on public.profiles
  for each row execute function public.handle_new_profile();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists spaces_updated_at on public.spaces;
create trigger spaces_updated_at
  before update on public.spaces
  for each row execute function public.set_updated_at();

drop trigger if exists rooms_updated_at on public.rooms;
create trigger rooms_updated_at
  before update on public.rooms
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: lecturas públicas/propias; escrituras solo service_role
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.spaces enable row level security;
alter table public.rooms enable row level security;
alter table public.room_versions enable row level security;
alter table public.assets enable row level security;
alter table public.asset_jobs enable row level security;
alter table public.reports enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.quotas enable row level security;

drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select using (true);

drop policy if exists spaces_read on public.spaces;
create policy spaces_read on public.spaces for select using (
  owner_id = auth.uid()
  or exists (
    select 1 from public.rooms r
    where r.space_id = spaces.id
      and r.visibility in ('published', 'unlisted')
  )
);

drop policy if exists rooms_read on public.rooms;
create policy rooms_read on public.rooms for select using (
  owner_id = auth.uid() or visibility in ('published', 'unlisted')
);

drop policy if exists versions_read on public.room_versions;
create policy versions_read on public.room_versions for select using (
  exists (
    select 1 from public.rooms r
    where r.id = room_versions.room_id
      and (r.owner_id = auth.uid() or r.published_version_id = room_versions.id)
  )
);

drop policy if exists assets_read on public.assets;
create policy assets_read on public.assets for select using (
  owner_id = auth.uid() or status = 'ready'
);

drop policy if exists jobs_read on public.asset_jobs;
create policy jobs_read on public.asset_jobs for select using (owner_id = auth.uid());

drop policy if exists quotas_read on public.quotas;
create policy quotas_read on public.quotas for select using (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Publicación transaccional
-- ---------------------------------------------------------------------------

create or replace function public.build_manifest(p_space_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'schemaVersion', 1,
    'generatedAt', now(),
    'spawnRoomId', (
      select s.spawn_room_id from public.spaces s where s.id = p_space_id
    ),
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
      where r.space_id = p_space_id
        and r.visibility in ('published', 'unlisted')
    ), '[]'::jsonb)
  );
$$;

create or replace function public.publish_room(
  p_room_id uuid,
  p_owner_id uuid,
  p_document_key text,
  p_stats jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_room public.rooms%rowtype;
  v_version_id uuid;
  v_version integer;
  v_visibility text;
begin
  select * into v_room
  from public.rooms
  where id = p_room_id
  for update;

  if not found then
    raise exception 'room_not_found';
  end if;

  if v_room.owner_id <> p_owner_id then
    raise exception 'not_owner';
  end if;

  if v_room.visibility = 'suspended' then
    raise exception 'room_suspended';
  end if;

  select coalesce(max(version), 0) + 1 into v_version
  from public.room_versions
  where room_id = p_room_id;

  v_visibility := case
    when v_room.visibility in ('published', 'unlisted') then v_room.visibility
    else 'unlisted'
  end;

  insert into public.room_versions (
    room_id, version, document_key, stats, created_by
  )
  values (
    p_room_id, v_version, p_document_key, p_stats, p_owner_id
  )
  returning id into v_version_id;

  update public.rooms
  set published_version_id = v_version_id,
      visibility = v_visibility,
      updated_at = now()
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

revoke all on function public.build_manifest(uuid)
  from public, anon, authenticated;
revoke all on function public.publish_room(uuid, uuid, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.build_manifest(uuid) to service_role;
grant execute on function public.publish_room(uuid, uuid, text, jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- Administración
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;
