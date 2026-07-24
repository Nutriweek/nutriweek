-- Ensure existing installations use the same image contract as new ones.
update storage.buckets
set public = true,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'recipe-images';

drop policy if exists "Users can upload their recipe images" on storage.objects;
drop policy if exists "Users can update their recipe images" on storage.objects;
drop policy if exists "Users can delete their recipe images" on storage.objects;

create policy "Users can upload their recipe images" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'recipe-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can update their recipe images" on storage.objects
for update to authenticated
using (
  bucket_id = 'recipe-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'recipe-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can delete their recipe images" on storage.objects
for delete to authenticated
using (
  bucket_id = 'recipe-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
