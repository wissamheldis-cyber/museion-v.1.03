-- ============================================================================
-- Museion V2.1 — profiles, studios, studio_members
-- ============================================================================

-- ---- profiles ---------------------------------------------------------------
-- 1:1 with auth.users. Created automatically by the handle_new_user trigger
-- below; the app never inserts into profiles directly.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create trigger trg_profiles_bump_version
  before update on public.profiles
  for each row execute function public.tg_bump_version();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger trg_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---- studios ------------------------------------------------------------------

create table public.studios (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  plan text not null default 'free' check (plan in ('free', 'pro', 'enterprise')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create trigger trg_studios_bump_version
  before update on public.studios
  for each row execute function public.tg_bump_version();

-- ---- studio_members -----------------------------------------------------------

create table public.studio_members (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'creator', 'reviewer')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  unique (studio_id, user_id)
);

create index idx_studio_members_studio on public.studio_members(studio_id);
create index idx_studio_members_user on public.studio_members(user_id);

create trigger trg_studio_members_bump_version
  before update on public.studio_members
  for each row execute function public.tg_bump_version();

-- Prevent removing/demoting the last owner of a studio so a studio can never
-- end up without anyone able to manage it.
create or replace function public.tg_protect_last_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining_owners integer;
begin
  if (tg_op = 'DELETE' and old.role = 'owner')
     or (tg_op = 'UPDATE' and old.role = 'owner' and new.role <> 'owner') then
    select count(*) into remaining_owners
    from public.studio_members
    where studio_id = old.studio_id
      and role = 'owner'
      and id <> old.id;
    if remaining_owners = 0 then
      raise exception 'Impossible de retirer le dernier owner du studio %', old.studio_id;
    end if;
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger trg_studio_members_protect_last_owner
  before update or delete on public.studio_members
  for each row execute function public.tg_protect_last_owner();

-- ---- RLS helper functions ------------------------------------------------------
-- SECURITY DEFINER + fixed search_path so they can be used inside RLS policies
-- on studio_members itself without recursive-policy evaluation.

create or replace function public.is_studio_member(p_studio_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.studio_members
    where studio_id = p_studio_id and user_id = auth.uid()
  );
$$;

create or replace function public.studio_role(p_studio_id uuid)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.studio_members
  where studio_id = p_studio_id and user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_studio_admin(p_studio_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.studio_members
    where studio_id = p_studio_id and user_id = auth.uid() and role in ('owner', 'admin')
  );
$$;

create or replace function public.can_create_in_studio(p_studio_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.studio_members
    where studio_id = p_studio_id and user_id = auth.uid() and role in ('owner', 'admin', 'creator')
  );
$$;

revoke all on function public.is_studio_member(uuid) from public;
revoke all on function public.studio_role(uuid) from public;
revoke all on function public.is_studio_admin(uuid) from public;
revoke all on function public.can_create_in_studio(uuid) from public;
grant execute on function public.is_studio_member(uuid) to authenticated;
grant execute on function public.studio_role(uuid) to authenticated;
grant execute on function public.is_studio_admin(uuid) to authenticated;
grant execute on function public.can_create_in_studio(uuid) to authenticated;
