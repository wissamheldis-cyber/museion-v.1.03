-- ============================================================================
-- Museion V2.1 — src/lib/types-sprint4.ts (writing assistant, production,
-- review, library) — extends existing V2 tables where the shapes already
-- match closely, adds the two tables that don't exist yet.
-- ============================================================================

-- WritingMessage belongs directly to a mission (no separate "conversation" in
-- the live UI), and carries an optional decision/hypothesis/open-question tag.
alter table public.messages
  add column mission_id uuid references public.writing_missions(id) on delete cascade,
  add column classification text check (classification in ('decision', 'hypothesis', 'open-question')),
  alter column conversation_id drop not null;

alter table public.messages
  add constraint messages_belongs_to_one_thread
    check (
      (conversation_id is not null and mission_id is null)
      or (conversation_id is null and mission_id is not null)
    );

create index idx_messages_mission on public.messages(mission_id);

-- WritingVariant is presented as a simple selectable option, not a full
-- accept/reject workflow.
alter table public.ai_proposals
  add column selected boolean not null default false;

-- ---- review_checklist_items -----------------------------------------------------

create table public.review_checklist_items (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete cascade,
  label text not null,
  checked boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create index idx_review_checklist_asset on public.review_checklist_items(asset_id);

create trigger trg_review_checklist_bump_version
  before update on public.review_checklist_items
  for each row execute function public.tg_bump_version();

-- ---- asset_collections (Library) -------------------------------------------------

create table public.asset_collections (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  asset_ids uuid[] not null default '{}',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create index idx_asset_collections_project on public.asset_collections(project_id);

create trigger trg_asset_collections_bump_version
  before update on public.asset_collections
  for each row execute function public.tg_bump_version();
