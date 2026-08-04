-- ============================================================================
-- Museion V2.1 — development seed
--
-- Idempotent: safe to run on every `supabase db reset`. Contains NO passwords
-- and NO auth.users rows — those must exist first (see
-- scripts/supabase/create-dev-users.mjs, an administrative script run
-- separately by a human with an admin token, never committed with secrets).
-- Studio membership is linked by email only once the matching Auth user
-- already exists; until then these inserts simply match zero rows.
-- ============================================================================

insert into public.studios (id, name, plan)
values
  ('00000000-0000-4000-8000-000000000001', 'Museion Studio', 'pro'),
  ('00000000-0000-4000-8000-000000000002', 'Jim Filmmaker Studio', 'pro'),
  ('00000000-0000-4000-8000-000000000003', 'GRIFZ Studio', 'pro')
on conflict (id) do nothing;

-- GRIFZ Studio doubles as "Studio B" for cross-studio isolation testing.

insert into public.studio_members (studio_id, user_id, role)
select '00000000-0000-4000-8000-000000000001', u.id, 'owner'
from auth.users u
where u.email = 'shou.edition@gmail.com'
on conflict (studio_id, user_id) do nothing;

insert into public.studio_members (studio_id, user_id, role)
select '00000000-0000-4000-8000-000000000002', u.id, 'owner'
from auth.users u
where u.email = 'jimfilmmakerai@gmail.com'
on conflict (studio_id, user_id) do nothing;

insert into public.studio_members (studio_id, user_id, role)
select '00000000-0000-4000-8000-000000000003', u.id, 'owner'
from auth.users u
where u.email = 'grifz.studio@gmail.com'
on conflict (studio_id, user_id) do nothing;
