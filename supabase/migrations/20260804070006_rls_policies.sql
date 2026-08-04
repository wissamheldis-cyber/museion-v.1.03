-- ============================================================================
-- Museion V2.1 — Row Level Security
--
-- Role model (public.studio_members.role): owner, admin, creator, reviewer.
-- Baseline: no table is exposed to `anon`. `authenticated` gets broad
-- table-level DML grants below; RLS policies are the real gate per table.
-- ============================================================================

grant usage on schema public to authenticated;

-- Table-level DML grants (RLS policies below are the actual gate).
grant select, insert, update, delete on
  public.profiles,
  public.studios,
  public.studio_members,
  public.projects,
  public.project_canon,
  public.project_context_snapshots,
  public.decisions,
  public.hypotheses,
  public.open_questions,
  public.conversations,
  public.messages,
  public.writing_missions,
  public.ai_proposals,
  public.skill_definitions,
  public.skill_runs,
  public.provider_connection_metadata,
  public.usage_events,
  public.generation_jobs,
  public.assets,
  public.asset_versions,
  public.asset_relations,
  public.reviews,
  public.review_comments,
  public.deliverables,
  public.audit_events
to authenticated;

alter default privileges for role postgres in schema public
  grant select, insert, update, delete on tables to authenticated;

-- ---- Studio creation RPC ---------------------------------------------------------
-- Direct INSERT into studios/studio_members is not exposed: creating a studio and
-- becoming its owner must happen atomically, which a bare RLS policy cannot express
-- (you cannot pass the studio_members check before the studio exists).

create or replace function public.create_studio(p_name text)
returns public.studios
language plpgsql
security definer
set search_path = public
as $$
declare
  v_studio public.studios;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise.';
  end if;

  insert into public.studios (name, created_by)
  values (p_name, auth.uid())
  returning * into v_studio;

  insert into public.studio_members (studio_id, user_id, role, created_by)
  values (v_studio.id, auth.uid(), 'owner', auth.uid());

  return v_studio;
end;
$$;

revoke all on function public.create_studio(text) from public;
grant execute on function public.create_studio(text) to authenticated;

-- ============================================================================
-- profiles
-- ============================================================================

alter table public.profiles enable row level security;

create policy profiles_select on public.profiles
for select to authenticated
using (
  id = auth.uid()
  or exists (
    select 1 from public.studio_members sm1
    join public.studio_members sm2 on sm1.studio_id = sm2.studio_id
    where sm1.user_id = auth.uid() and sm2.user_id = profiles.id
  )
);

create policy profiles_update_self on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- ============================================================================
-- studios
-- ============================================================================

alter table public.studios enable row level security;

create policy studios_select on public.studios
for select to authenticated
using (public.is_studio_member(id));

create policy studios_update_admin on public.studios
for update to authenticated
using (public.is_studio_admin(id))
with check (public.is_studio_admin(id));

create policy studios_delete_owner on public.studios
for delete to authenticated
using (public.studio_role(id) = 'owner');

-- No INSERT policy: studio creation goes through create_studio() only.

-- ============================================================================
-- studio_members
-- ============================================================================

alter table public.studio_members enable row level security;

create policy studio_members_select on public.studio_members
for select to authenticated
using (public.is_studio_member(studio_id));

create policy studio_members_insert_admin on public.studio_members
for insert to authenticated
with check (public.is_studio_admin(studio_id));

create policy studio_members_update_admin on public.studio_members
for update to authenticated
using (public.is_studio_admin(studio_id))
with check (public.is_studio_admin(studio_id));

create policy studio_members_delete on public.studio_members
for delete to authenticated
using (public.is_studio_admin(studio_id) or user_id = auth.uid());

-- ============================================================================
-- projects
-- ============================================================================

alter table public.projects enable row level security;

create policy projects_select on public.projects
for select to authenticated
using (public.is_studio_member(studio_id));

create policy projects_insert on public.projects
for insert to authenticated
with check (public.can_create_in_studio(studio_id));

create policy projects_update on public.projects
for update to authenticated
using (public.can_create_in_studio(studio_id))
with check (public.can_create_in_studio(studio_id));

create policy projects_delete_admin on public.projects
for delete to authenticated
using (public.is_studio_admin(studio_id));

-- ============================================================================
-- Generic content tables:
-- project_canon, project_context_snapshots, decisions, hypotheses, open_questions,
-- conversations, messages, writing_missions, ai_proposals, skill_runs,
-- generation_jobs, assets, asset_versions, asset_relations, deliverables
--
-- SELECT: any studio member. INSERT/UPDATE: owner/admin/creator.
-- DELETE: owner/admin, or the creator deleting their own row.
-- ============================================================================

do $$
declare
  t text;
  content_tables text[] := array[
    'project_canon', 'project_context_snapshots', 'decisions', 'hypotheses',
    'open_questions', 'conversations', 'messages', 'writing_missions',
    'ai_proposals', 'skill_runs', 'generation_jobs', 'assets', 'asset_versions',
    'asset_relations', 'deliverables'
  ];
begin
  foreach t in array content_tables loop
    execute format('alter table public.%I enable row level security', t);

    execute format(
      'create policy %I_select on public.%I for select to authenticated using (public.is_studio_member(studio_id))',
      t, t
    );
    execute format(
      'create policy %I_insert on public.%I for insert to authenticated with check (public.can_create_in_studio(studio_id))',
      t, t
    );
    execute format(
      'create policy %I_update on public.%I for update to authenticated using (public.can_create_in_studio(studio_id)) with check (public.can_create_in_studio(studio_id))',
      t, t
    );
    execute format(
      'create policy %I_delete on public.%I for delete to authenticated using (public.is_studio_admin(studio_id) or (created_by = auth.uid() and public.can_create_in_studio(studio_id)))',
      t, t
    );
  end loop;
end $$;

-- ============================================================================
-- reviews / review_comments — every studio member (incl. reviewer) can
-- participate; deletion of a comment is limited to its author or an admin.
-- ============================================================================

alter table public.reviews enable row level security;

create policy reviews_select on public.reviews
for select to authenticated
using (public.is_studio_member(studio_id));

create policy reviews_insert on public.reviews
for insert to authenticated
with check (public.is_studio_member(studio_id));

create policy reviews_update on public.reviews
for update to authenticated
using (public.is_studio_member(studio_id))
with check (public.is_studio_member(studio_id));

create policy reviews_delete_admin on public.reviews
for delete to authenticated
using (public.is_studio_admin(studio_id));

alter table public.review_comments enable row level security;

create policy review_comments_select on public.review_comments
for select to authenticated
using (public.is_studio_member(studio_id));

create policy review_comments_insert on public.review_comments
for insert to authenticated
with check (public.is_studio_member(studio_id));

create policy review_comments_update on public.review_comments
for update to authenticated
using (public.is_studio_member(studio_id))
with check (public.is_studio_member(studio_id));

create policy review_comments_delete on public.review_comments
for delete to authenticated
using (public.is_studio_admin(studio_id) or created_by = auth.uid());

-- ============================================================================
-- skill_definitions — global read-only catalog, managed outside RLS (migrations
-- / service role only).
-- ============================================================================

alter table public.skill_definitions enable row level security;

create policy skill_definitions_select on public.skill_definitions
for select to authenticated
using (true);

-- ============================================================================
-- provider_connection_metadata — sensitive studio settings: owner/admin only.
-- ============================================================================

alter table public.provider_connection_metadata enable row level security;

create policy provider_metadata_select on public.provider_connection_metadata
for select to authenticated
using (public.is_studio_member(studio_id));

create policy provider_metadata_write on public.provider_connection_metadata
for all to authenticated
using (public.is_studio_admin(studio_id))
with check (public.is_studio_admin(studio_id));

-- ============================================================================
-- usage_events — billing data: owner/admin read-only. No client-side writes;
-- these are inserted by trusted backend code using the service role, which
-- bypasses RLS entirely.
-- ============================================================================

alter table public.usage_events enable row level security;

create policy usage_events_select_admin on public.usage_events
for select to authenticated
using (public.is_studio_admin(studio_id));

-- ============================================================================
-- audit_events — append-only: select + insert for studio members, no update
-- or delete policy at all (so both are denied to `authenticated`).
-- ============================================================================

alter table public.audit_events enable row level security;

create policy audit_events_select on public.audit_events
for select to authenticated
using (public.is_studio_member(studio_id));

create policy audit_events_insert on public.audit_events
for insert to authenticated
with check (public.is_studio_member(studio_id));
