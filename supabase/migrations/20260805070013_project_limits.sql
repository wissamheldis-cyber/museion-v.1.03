-- ============================================================================
-- Museion V2.1 — per-studio project limit
--
-- NULL = illimité (réservé au studio Museion / shou.edition@gmail.com via
-- supabase/seed.sql). Toute autre valeur est le nombre max de projets non
-- démo qu'un studio peut créer.
-- ============================================================================

alter table public.studios
  add column project_limit integer default 3
    check (project_limit is null or project_limit > 0);

-- ---- projects.counts_toward_project_limit ----------------------------------
-- Distinct from is_demo (qui pilote l'UI de visite guidée sur Gilgamesh) :
-- les 6 projets de démo peuplés au bootstrap d'un studio neuf
-- (bootstrapDemoData) doivent tous être exclus du quota, pas seulement
-- Gilgamesh.

alter table public.projects
  add column counts_toward_project_limit boolean not null default true;

-- ---- Enforcement (défense en profondeur : le store vérifie déjà côté
-- client, ceci empêche un contournement via un appel direct à l'API) --------

create or replace function public.tg_enforce_project_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer;
  v_count integer;
begin
  if not new.counts_toward_project_limit then
    return new;
  end if;

  select project_limit into v_limit
  from public.studios
  where id = new.studio_id;

  if v_limit is null then
    return new;
  end if;

  select count(*) into v_count
  from public.projects
  where studio_id = new.studio_id and counts_toward_project_limit;

  if v_count >= v_limit then
    raise exception 'Limite de % projets atteinte pour ce studio.', v_limit;
  end if;

  return new;
end;
$$;

create trigger trg_projects_enforce_limit
  before insert on public.projects
  for each row execute function public.tg_enforce_project_limit();
