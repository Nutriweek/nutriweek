-- Recipe ownership is represented by the existing source_type and created_by fields:
-- system recipes are shared/read-only; user recipes are private and owned by their author.
create index if not exists recipes_user_library_idx
  on public.recipes (created_by, is_active, name)
  where source_type = 'user' and is_active;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recipe-images', 'recipe-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can upload their recipe images" on storage.objects
for insert to authenticated
with check (bucket_id = 'recipe-images' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "Users can update their recipe images" on storage.objects
for update to authenticated
using (bucket_id = 'recipe-images' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "Users can delete their recipe images" on storage.objects
for delete to authenticated
using (bucket_id = 'recipe-images' and (storage.foldername(name))[1] = (select auth.uid()::text));
