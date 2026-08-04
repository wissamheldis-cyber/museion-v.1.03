-- ============================================================================
-- Museion V2.1 — storyboard (src/lib/types-storyboard.ts)
-- sequences, scenes, shots, canvas edges, asset lifecycle journal, continuity.
-- ============================================================================

create table public.sequences (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  number integer not null,
  title text not null,
  description text not null default '',
  color text not null default '#8e9099',
  order_index integer not null default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create index idx_sequences_project on public.sequences(project_id);

create trigger trg_sequences_bump_version
  before update on public.sequences
  for each row execute function public.tg_bump_version();

-- ---- storyboard_scenes -----------------------------------------------------------

create table public.storyboard_scenes (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  sequence_id uuid references public.sequences(id) on delete set null,
  number integer not null,
  title text not null default '',
  location text not null default '',
  time_of_day text not null default 'INT' check (time_of_day in ('INT', 'EXT', 'INT/EXT')),
  moment text not null default 'Jour' check (moment in ('Aube', 'Jour', 'Crépuscule', 'Nuit')),
  emotion text not null default '',
  intention text not null default '',
  description text not null default '',
  lighting text not null default '',
  duration_seconds numeric not null default 0,
  main_shot_type text,
  asset_id uuid references public.assets(id) on delete set null,
  order_index integer not null default 0,
  canvas_x double precision not null default 0,
  canvas_y double precision not null default 0,
  notes text not null default '',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create index idx_storyboard_scenes_project on public.storyboard_scenes(project_id);
create index idx_storyboard_scenes_sequence on public.storyboard_scenes(sequence_id);

create trigger trg_storyboard_scenes_bump_version
  before update on public.storyboard_scenes
  for each row execute function public.tg_bump_version();

-- ---- shots --------------------------------------------------------------------

create table public.shots (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  scene_id uuid not null references public.storyboard_scenes(id) on delete cascade,
  number integer not null,
  type text not null,
  focal text not null default '',
  camera text not null default '',
  sensor text not null default '',
  ratio text not null default '',
  movement text not null default 'static',
  angle text not null default '',
  height text not null default '',
  filter text not null default '',
  duration_seconds numeric not null default 0,
  frame_rate numeric not null default 24,
  lighting text not null default '',
  decor text not null default '',
  continuity text not null default '',
  risks text not null default '',
  reference_notes text[] not null default '{}',
  notes text not null default '',
  asset_id uuid references public.assets(id) on delete set null,
  order_index integer not null default 0,
  validated boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create index idx_shots_project on public.shots(project_id);
create index idx_shots_scene on public.shots(scene_id);

create trigger trg_shots_bump_version
  before update on public.shots
  for each row execute function public.tg_bump_version();

-- ---- storyboard_edges (canvas connections) -----------------------------------

create table public.storyboard_edges (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  source_scene_id uuid not null references public.storyboard_scenes(id) on delete cascade,
  target_scene_id uuid not null references public.storyboard_scenes(id) on delete cascade,
  type text not null default 'sequential' check (type in ('sequential', 'alternative')),
  label text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index idx_storyboard_edges_project on public.storyboard_edges(project_id);
create index idx_storyboard_edges_source on public.storyboard_edges(source_scene_id);
create index idx_storyboard_edges_target on public.storyboard_edges(target_scene_id);

-- ---- asset_journal_entries (append-only, mirrors src/lib/assetLifecycle.ts) ----

create table public.asset_journal_entries (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete cascade,
  asset_name text not null,
  action text not null,
  from_status text check (from_status in (
    'ephemeral', 'candidate', 'approved', 'canonical', 'archived', 'deleted'
  )),
  to_status text check (to_status in (
    'ephemeral', 'candidate', 'approved', 'canonical', 'archived', 'deleted'
  )),
  decided_by text not null,
  decided_at timestamptz not null default now(),
  note text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index idx_asset_journal_project on public.asset_journal_entries(project_id);
create index idx_asset_journal_asset on public.asset_journal_entries(asset_id);

-- ---- continuity_rules -----------------------------------------------------------

create table public.continuity_rules (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  description text not null,
  affected_scenes text[] not null default '{}',
  severity text not null default 'info' check (severity in ('info', 'warning', 'critical')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create index idx_continuity_rules_project on public.continuity_rules(project_id);

create trigger trg_continuity_rules_bump_version
  before update on public.continuity_rules
  for each row execute function public.tg_bump_version();
