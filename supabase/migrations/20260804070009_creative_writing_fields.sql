-- ============================================================================
-- Museion V2.1 — creative-writing fields the live app actually uses
-- (src/lib/types.ts: Project.vision/treatment/artisticDossier/workflow,
-- loglineHistory, characters, script) — not part of the schema-v2.ts model,
-- but required to move the real Development tab off localStorage.
-- ============================================================================

alter table public.projects
  add column is_archived boolean not null default false,
  add column demo_version text;

alter table public.project_canon
  add column treatment jsonb,
  add column vision jsonb,
  add column artistic_dossier jsonb,
  add column workflow jsonb not null default '[]'::jsonb;

create table public.logline_versions (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  content text not null,
  word_count integer not null default 0,
  label text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create index idx_logline_versions_project on public.logline_versions(project_id);

create trigger trg_logline_versions_bump_version
  before update on public.logline_versions
  for each row execute function public.tg_bump_version();

create table public.characters (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  role text not null default '',
  actor text,
  objective text not null default '',
  inner_need text not null default '',
  contradiction text not null default '',
  arc text not null default '',
  relations jsonb not null default '[]'::jsonb,
  appearance text not null default '',
  costume text not null default '',
  continuity_notes text not null default '',
  reference_assets jsonb not null default '[]'::jsonb,
  image_url text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create index idx_characters_project on public.characters(project_id);

create trigger trg_characters_bump_version
  before update on public.characters
  for each row execute function public.tg_bump_version();

create table public.script_scenes (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  number integer not null,
  title text not null default '',
  location text not null default '',
  time_of_day text not null default 'INT' check (time_of_day in ('INT', 'EXT', 'INT/EXT')),
  blocks jsonb not null default '[]'::jsonb,
  order_index integer not null default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create index idx_script_scenes_project on public.script_scenes(project_id);

create trigger trg_script_scenes_bump_version
  before update on public.script_scenes
  for each row execute function public.tg_bump_version();
