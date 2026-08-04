-- ============================================================================
-- Museion V2.1 — Extensions & helper functions
-- ============================================================================

create extension if not exists pgcrypto;

-- Generic trigger: bump updated_at + version on every UPDATE.
create or replace function public.tg_bump_version()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  new.version := coalesce(old.version, 0) + 1;
  return new;
end;
$$;

comment on function public.tg_bump_version() is
  'Row-level guarantee that updated_at/version stay in sync on every UPDATE, independent of client behaviour.';
