-- ============================================================================
-- Museion V2.1 — projects, canon, context snapshots, traceability
-- ============================================================================

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  slug text not null,
  title text not null check (char_length(trim(title)) > 0),
  status text not null check (status in (
    'draft', 'concept', 'development', 'pre-production', 'production', 'post-production', 'archived'
  )),
  format text not null check (format in ('feature', 'short', 'documentary', 'series', 'animation')),
  genre text not null check (genre in (
    'historical', 'epic', 'drama', 'thriller', 'documentary', 'fantasy', 'scifi', 'comedy'
  )),
  cover_image_url text,
  is_favorite boolean not null default false,
  completion_percent numeric not null default 0 check (completion_percent between 0 and 100),
  is_demo boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  unique (studio_id, slug)
);

create index idx_projects_studio on public.projects(studio_id);

create trigger trg_projects_bump_version
  before update on public.projects
  for each row execute function public.tg_bump_version();

-- ---- project_canon (one row per project) ---------------------------------------

create table public.project_canon (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  project_id uuid not null unique references public.projects(id) on delete cascade,
  logline text not null default '',
  synopsis_short text not null default '',
  synopsis_long text not null default '',
  synopsis_beginning text not null default '',
  synopsis_development text not null default '',
  synopsis_resolution text not null default '',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create index idx_project_canon_project on public.project_canon(project_id);

create trigger trg_project_canon_bump_version
  before update on public.project_canon
  for each row execute function public.tg_bump_version();

-- ---- project_context_snapshots --------------------------------------------------

create table public.project_context_snapshots (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  canon jsonb not null default '{}'::jsonb,
  decisions uuid[] not null default '{}',
  hypotheses uuid[] not null default '{}',
  open_questions uuid[] not null default '{}',
  reference_asset_ids uuid[] not null default '{}',
  snapshot_label text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create index idx_context_snapshots_project on public.project_context_snapshots(project_id);

create trigger trg_context_snapshots_bump_version
  before update on public.project_context_snapshots
  for each row execute function public.tg_bump_version();

-- ---- decisions / hypotheses / open_questions -------------------------------------

create table public.decisions (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  content text not null,
  context text,
  provenance jsonb not null default '{"type":"human"}'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create index idx_decisions_project on public.decisions(project_id);

create trigger trg_decisions_bump_version
  before update on public.decisions
  for each row execute function public.tg_bump_version();

create table public.hypotheses (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  content text not null,
  to_validate text,
  provenance jsonb not null default '{"type":"human"}'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create index idx_hypotheses_project on public.hypotheses(project_id);

create trigger trg_hypotheses_bump_version
  before update on public.hypotheses
  for each row execute function public.tg_bump_version();

create table public.open_questions (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  content text not null,
  priority text not null check (priority in ('low', 'medium', 'high')),
  provenance jsonb not null default '{"type":"human"}'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create index idx_open_questions_project on public.open_questions(project_id);

create trigger trg_open_questions_bump_version
  before update on public.open_questions
  for each row execute function public.tg_bump_version();
