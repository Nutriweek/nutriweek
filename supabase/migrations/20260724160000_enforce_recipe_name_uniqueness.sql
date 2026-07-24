create or replace function public.enforce_active_recipe_name_uniqueness()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  normalized_name text := lower(regexp_replace(btrim(new.name), '\s+', ' ', 'g'));
begin
  if new.is_active and new.source_type = 'user' and exists (
    select 1
    from public.recipes
    where is_active
      and id is distinct from new.id
      and (
        source_type = 'system'
        or (source_type = 'user' and created_by = new.created_by)
      )
      and lower(regexp_replace(btrim(name), '\s+', ' ', 'g')) = normalized_name
  ) then
    raise exception 'recipe_name_conflict' using errcode = '23505';
  end if;
  return new;
end;
$$;

drop trigger if exists recipes_enforce_active_name_uniqueness on public.recipes;
create trigger recipes_enforce_active_name_uniqueness
before insert or update of name, is_active, source_type, created_by on public.recipes
for each row execute function public.enforce_active_recipe_name_uniqueness();
