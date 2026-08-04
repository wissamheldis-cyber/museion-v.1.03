-- ============================================================================
-- Museion V2.1 — reviews, deliverables, audit
-- ============================================================================

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete cascade,
  status text not null default 'pending' check (status in (
    'pending', 'approved', 'rejected', 'changes_requested'
  )),
  decided_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create index idx_reviews_project on public.reviews(project_id);
create index idx_reviews_asset on public.reviews(asset_id);

create trigger trg_reviews_bump_version
  before update on public.reviews
  for each row execute function public.tg_bump_version();

create table public.review_comments (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  review_id uuid references public.reviews(id) on delete set null,
  asset_id uuid not null references public.assets(id) on delete cascade,
  content text not null,
  author_name text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create index idx_review_comments_asset on public.review_comments(asset_id);
create index idx_review_comments_review on public.review_comments(review_id);

create trigger trg_review_comments_bump_version
  before update on public.review_comments
  for each row execute function public.tg_bump_version();

create table public.deliverables (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  format text not null check (format in ('html', 'json', 'pdf')),
  sections jsonb not null default '[]'::jsonb,
  exported_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create index idx_deliverables_project on public.deliverables(project_id);

create trigger trg_deliverables_bump_version
  before update on public.deliverables
  for each row execute function public.tg_bump_version();

-- ---- audit_events (append-only) ---------------------------------------------------

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  details jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create index idx_audit_events_studio on public.audit_events(studio_id);
create index idx_audit_events_project on public.audit_events(project_id);

-- No update/delete trigger needed: append-only is enforced entirely by the
-- absence of UPDATE/DELETE RLS policies in the next migration.
