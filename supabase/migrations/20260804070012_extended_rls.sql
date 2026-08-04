-- ============================================================================
-- Museion V2.1 — RLS for the tables added in 070009/070010/070011.
-- Same role model and grant pattern as 070006/070008.
-- ============================================================================

grant select, insert, update, delete on
  public.logline_versions,
  public.characters,
  public.script_scenes,
  public.sequences,
  public.storyboard_scenes,
  public.shots,
  public.storyboard_edges,
  public.asset_journal_entries,
  public.continuity_rules,
  public.review_checklist_items,
  public.asset_collections
to authenticated, service_role;

-- ---- standard content tables: select=member, insert/update=creator+, -------
-- delete=admin or own creator.

do $$
declare
  t text;
  content_tables text[] := array[
    'logline_versions', 'characters', 'script_scenes', 'sequences',
    'storyboard_scenes', 'shots', 'continuity_rules', 'review_checklist_items',
    'asset_collections'
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

-- ---- storyboard_edges: select/insert/delete only, no update (no version col) ----

alter table public.storyboard_edges enable row level security;

create policy storyboard_edges_select on public.storyboard_edges
for select to authenticated
using (public.is_studio_member(studio_id));

create policy storyboard_edges_insert on public.storyboard_edges
for insert to authenticated
with check (public.can_create_in_studio(studio_id));

create policy storyboard_edges_delete on public.storyboard_edges
for delete to authenticated
using (public.is_studio_admin(studio_id) or (created_by = auth.uid() and public.can_create_in_studio(studio_id)));

-- ---- asset_journal_entries: append-only, like audit_events ----------------------

alter table public.asset_journal_entries enable row level security;

create policy asset_journal_select on public.asset_journal_entries
for select to authenticated
using (public.is_studio_member(studio_id));

create policy asset_journal_insert on public.asset_journal_entries
for insert to authenticated
with check (public.can_create_in_studio(studio_id));
