-- ============================================================================
-- Museion V2.1 — conversations, writing, skills, providers, usage
-- ============================================================================

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create index idx_conversations_project on public.conversations(project_id);

create trigger trg_conversations_bump_version
  before update on public.conversations
  for each row execute function public.tg_bump_version();

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  provenance jsonb not null default '{"type":"human"}'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create index idx_messages_conversation on public.messages(conversation_id);
create index idx_messages_project on public.messages(project_id);

create trigger trg_messages_bump_version
  before update on public.messages
  for each row execute function public.tg_bump_version();

create table public.writing_missions (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  target text not null check (target in (
    'vision', 'logline', 'synopsis', 'treatment', 'characters', 'script', 'general'
  )),
  context_snapshot text not null default '',
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create index idx_writing_missions_project on public.writing_missions(project_id);

create trigger trg_writing_missions_bump_version
  before update on public.writing_missions
  for each row execute function public.tg_bump_version();

create table public.ai_proposals (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  mission_id uuid not null references public.writing_missions(id) on delete cascade,
  target text not null check (target in (
    'vision', 'logline', 'synopsis', 'treatment', 'characters', 'script', 'general'
  )),
  content text not null,
  label text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  provenance jsonb not null default '{"type":"ai"}'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create index idx_ai_proposals_mission on public.ai_proposals(mission_id);
create index idx_ai_proposals_project on public.ai_proposals(project_id);

create trigger trg_ai_proposals_bump_version
  before update on public.ai_proposals
  for each row execute function public.tg_bump_version();

-- ---- skill_definitions (global catalog, not studio-scoped) -----------------------

create table public.skill_definitions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null default '',
  parameters_schema jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create trigger trg_skill_definitions_bump_version
  before update on public.skill_definitions
  for each row execute function public.tg_bump_version();

create table public.skill_runs (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  skill_id uuid not null references public.skill_definitions(id),
  parameters jsonb not null default '{}'::jsonb,
  result jsonb,
  status text not null default 'running' check (status in ('running', 'success', 'error')),
  error text,
  provenance jsonb not null default '{"type":"system"}'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create index idx_skill_runs_project on public.skill_runs(project_id);

create trigger trg_skill_runs_bump_version
  before update on public.skill_runs
  for each row execute function public.tg_bump_version();

-- ---- provider_connection_metadata (studio-scoped, sensitive) ----------------------

create table public.provider_connection_metadata (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  provider text not null,
  is_connected boolean not null default false,
  last_check_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  unique (studio_id, provider)
);

create trigger trg_provider_metadata_bump_version
  before update on public.provider_connection_metadata
  for each row execute function public.tg_bump_version();

-- ---- usage_events (studio-scoped, billing-sensitive) ------------------------------

create table public.usage_events (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  provider text not null,
  operation text not null,
  tokens integer,
  cost numeric,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create index idx_usage_events_studio on public.usage_events(studio_id);

create trigger trg_usage_events_bump_version
  before update on public.usage_events
  for each row execute function public.tg_bump_version();
