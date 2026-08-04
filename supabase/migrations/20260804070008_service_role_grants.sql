-- ============================================================================
-- Museion V2.1 — service_role privileges
--
-- BYPASSRLS on service_role skips row-level policies, but standard SQL GRANTs
-- are a separate layer: without them, service_role gets "permission denied"
-- before RLS is even evaluated. Grant it full DML on every app table, plus a
-- default-privileges rule so future migrations don't need to repeat this.
-- ============================================================================

grant usage on schema public to service_role;

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
to service_role;

alter default privileges for role postgres in schema public
  grant select, insert, update, delete on tables to service_role;
