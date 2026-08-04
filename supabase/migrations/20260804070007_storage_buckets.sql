-- ============================================================================
-- Museion V2.1 — private storage buckets
--
-- Path convention for studio/project buckets: {studioId}/{projectId}/{category}/{filename}
-- The `avatars` bucket is user-scoped, not project-scoped: {userId}/{filename}.
-- Every bucket is private; there is no anon access anywhere in this file.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('project-references', 'project-references', false, 52428800),
  ('project-assets', 'project-assets', false, 52428800),
  ('generation-outputs', 'generation-outputs', false, 52428800),
  ('temporary-assets', 'temporary-assets', false, 52428800),
  ('exports', 'exports', false, 52428800),
  ('avatars', 'avatars', false, 5242880)
on conflict (id) do nothing;

-- ---- helper: first path segment as uuid, null if malformed --------------------

create or replace function public.storage_studio_id(p_name text)
returns uuid
language sql
immutable
as $$
  select nullif((storage.foldername(p_name))[1], '')::uuid;
$$;

-- ============================================================================
-- project-references / project-assets / temporary-assets
-- Read: any studio member. Write: owner/admin/creator. Delete: owner/admin or
-- the uploader.
-- ============================================================================

do $$
declare
  b text;
  creator_buckets text[] := array['project-references', 'project-assets', 'temporary-assets'];
begin
  foreach b in array creator_buckets loop
    execute format(
      $p$create policy "%1$s_select" on storage.objects for select to authenticated
        using (bucket_id = %2$L and public.is_studio_member(public.storage_studio_id(name)))$p$,
      b || '_read', b
    );
    execute format(
      $p$create policy "%1$s_insert" on storage.objects for insert to authenticated
        with check (bucket_id = %2$L and public.can_create_in_studio(public.storage_studio_id(name)))$p$,
      b || '_write', b
    );
    execute format(
      $p$create policy "%1$s_update" on storage.objects for update to authenticated
        using (bucket_id = %2$L and public.can_create_in_studio(public.storage_studio_id(name)))
        with check (bucket_id = %2$L and public.can_create_in_studio(public.storage_studio_id(name)))$p$,
      b || '_modify', b
    );
    execute format(
      $p$create policy "%1$s_delete" on storage.objects for delete to authenticated
        using (bucket_id = %2$L and (
          public.is_studio_admin(public.storage_studio_id(name))
          or owner = auth.uid()
        ))$p$,
      b || '_remove', b
    );
  end loop;
end $$;

-- ============================================================================
-- generation-outputs — system/creator writes, studio-wide read.
-- ============================================================================

create policy "generation_outputs_read" on storage.objects
for select to authenticated
using (bucket_id = 'generation-outputs' and public.is_studio_member(public.storage_studio_id(name)));

create policy "generation_outputs_write" on storage.objects
for insert to authenticated
with check (bucket_id = 'generation-outputs' and public.can_create_in_studio(public.storage_studio_id(name)));

create policy "generation_outputs_modify" on storage.objects
for update to authenticated
using (bucket_id = 'generation-outputs' and public.can_create_in_studio(public.storage_studio_id(name)))
with check (bucket_id = 'generation-outputs' and public.can_create_in_studio(public.storage_studio_id(name)));

create policy "generation_outputs_remove" on storage.objects
for delete to authenticated
using (bucket_id = 'generation-outputs' and public.is_studio_admin(public.storage_studio_id(name)));

-- ============================================================================
-- exports — final deliverables: owner/admin manage, whole studio can read.
-- ============================================================================

create policy "exports_read" on storage.objects
for select to authenticated
using (bucket_id = 'exports' and public.is_studio_member(public.storage_studio_id(name)));

create policy "exports_write" on storage.objects
for insert to authenticated
with check (bucket_id = 'exports' and public.is_studio_admin(public.storage_studio_id(name)));

create policy "exports_modify" on storage.objects
for update to authenticated
using (bucket_id = 'exports' and public.is_studio_admin(public.storage_studio_id(name)))
with check (bucket_id = 'exports' and public.is_studio_admin(public.storage_studio_id(name)));

create policy "exports_remove" on storage.objects
for delete to authenticated
using (bucket_id = 'exports' and public.is_studio_admin(public.storage_studio_id(name)));

-- ============================================================================
-- avatars — user-scoped: {userId}/{filename}. Readable by the owner and by
-- anyone who shares a studio with them; writable only by the owner.
-- ============================================================================

create policy "avatars_read" on storage.objects
for select to authenticated
using (
  bucket_id = 'avatars'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1 from public.studio_members sm1
      join public.studio_members sm2 on sm1.studio_id = sm2.studio_id
      where sm1.user_id = auth.uid()
        and sm2.user_id::text = (storage.foldername(name))[1]
    )
  )
);

create policy "avatars_write" on storage.objects
for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_modify" on storage.objects
for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_remove" on storage.objects
for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
