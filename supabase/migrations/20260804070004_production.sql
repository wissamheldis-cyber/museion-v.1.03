-- ============================================================================
-- Museion V2.1 — generation jobs & assets
-- ============================================================================

create table public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  label text not null,
  kind text not null check (kind in ('image', 'video', 'text', 'audio')),
  status text not null default 'draft' check (status in (
    'draft', 'queued', 'running', 'review_required', 'approved', 'failed', 'cancelled'
  )),
  prompt text not null default '',
  parameters jsonb not null default '{}'::jsonb,
  provider text not null,
  scene_id uuid,
  shot_id uuid,
  reference_asset_ids uuid[] not null default '{}',
  result_asset_id uuid,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  provenance jsonb not null default '{"type":"system"}'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create index idx_generation_jobs_project on public.generation_jobs(project_id);

create trigger trg_generation_jobs_bump_version
  before update on public.generation_jobs
  for each row execute function public.tg_bump_version();

-- ---- assets --------------------------------------------------------------------
-- `deleted` is a terminal status: mirrors src/lib/assetLifecycle.ts ALLOWED_TRANSITIONS
-- so the rule holds even if a client bypasses the store.

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  type text not null check (type in (
    'image', 'video', 'reference', 'character', 'decor', 'document'
  )),
  status text not null default 'ephemeral' check (status in (
    'ephemeral', 'candidate', 'approved', 'canonical', 'archived', 'deleted'
  )),
  url text not null,
  thumbnail_url text,
  scene_id text,
  sequence_id text,
  shot_id text,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  provenance jsonb not null default '{"type":"human"}'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create index idx_assets_project on public.assets(project_id);

create trigger trg_assets_bump_version
  before update on public.assets
  for each row execute function public.tg_bump_version();

create or replace function public.tg_assets_enforce_lifecycle()
returns trigger
language plpgsql
as $$
declare
  allowed_next text[];
begin
  if old.status = new.status then
    return new;
  end if;
  if old.status = 'deleted' then
    raise exception 'Un asset supprimé ne peut plus changer de statut, et jamais devenir validé.';
  end if;

  allowed_next := case old.status
    when 'ephemeral' then array['candidate', 'approved', 'archived', 'deleted']
    when 'candidate' then array['approved', 'archived', 'deleted']
    when 'approved' then array['canonical', 'archived', 'deleted']
    when 'canonical' then array['archived', 'deleted']
    when 'archived' then array['candidate', 'approved', 'deleted']
    else array[]::text[]
  end;

  if not (new.status = any(allowed_next)) then
    raise exception 'Transition % -> % non autorisée.', old.status, new.status;
  end if;

  return new;
end;
$$;

create trigger trg_assets_enforce_lifecycle
  before update of status on public.assets
  for each row execute function public.tg_assets_enforce_lifecycle();

-- ---- asset_versions --------------------------------------------------------------

create table public.asset_versions (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete cascade,
  url text not null,
  prompt text,
  status text not null check (status in (
    'ephemeral', 'candidate', 'approved', 'canonical', 'archived', 'deleted'
  )),
  provenance jsonb not null default '{"type":"human"}'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create index idx_asset_versions_asset on public.asset_versions(asset_id);

create trigger trg_asset_versions_bump_version
  before update on public.asset_versions
  for each row execute function public.tg_bump_version();

-- ---- asset_relations --------------------------------------------------------------

create table public.asset_relations (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete cascade,
  related_asset_id uuid not null references public.assets(id) on delete cascade,
  type text not null check (type in ('reference', 'variation', 'derived')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  check (asset_id <> related_asset_id)
);

create index idx_asset_relations_asset on public.asset_relations(asset_id);
