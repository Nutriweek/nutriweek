create function public.is_recipe_author(target_recipe_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.recipes
    where id = target_recipe_id
      and source_type = 'user'
      and created_by = (select auth.uid())
  );
$$;

drop policy "Users can read recipe household access they participate in" on public.recipe_household_access;
drop policy "Recipe authors can manage household recipe access" on public.recipe_household_access;

create policy "Users can read recipe household access they participate in" on public.recipe_household_access
for select to authenticated using (
  public.is_household_member(household_id)
  or public.is_recipe_author(recipe_id)
);

create policy "Recipe authors can manage household recipe access" on public.recipe_household_access
for all to authenticated using (public.is_recipe_author(recipe_id))
with check (
  public.is_recipe_author(recipe_id)
  and public.is_household_member(household_id)
);

grant execute on function public.is_recipe_author(uuid) to authenticated;
