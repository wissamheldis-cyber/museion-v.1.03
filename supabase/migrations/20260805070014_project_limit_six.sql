-- ============================================================================
-- Museion V2.1 — project_limit default raised from 3 to 6
-- ============================================================================

alter table public.studios
  alter column project_limit set default 6;

-- Studios still on the old default (3) move to the new one. Leaves the
-- unlimited studio (null) and any studio deliberately set to another value
-- untouched.
update public.studios
set project_limit = 6
where project_limit = 3;
