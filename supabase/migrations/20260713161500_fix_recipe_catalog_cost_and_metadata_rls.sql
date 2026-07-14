create or replace function public.refresh_recipe_cost_from_child()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recalculate_recipe_estimated_cost(coalesce(new.recipe_id, old.recipe_id));
  return null;
end;
$$;

drop trigger recipe_ingredients_refresh_cost on public.recipe_ingredients;
create trigger recipe_ingredients_refresh_cost after insert or update or delete on public.recipe_ingredients
for each row execute function public.refresh_recipe_cost_from_child();

drop policy "Authenticated users can read recipe diet metadata" on public.recipe_diet_compatibilities;
create policy "Users can read diet metadata for visible recipes" on public.recipe_diet_compatibilities
for select to authenticated using (exists (select 1 from public.recipes where recipes.id = recipe_diet_compatibilities.recipe_id));

drop policy "Authenticated users can read recipe equipment metadata" on public.recipe_required_equipment;
create policy "Users can read equipment metadata for visible recipes" on public.recipe_required_equipment
for select to authenticated using (exists (select 1 from public.recipes where recipes.id = recipe_required_equipment.recipe_id));

drop policy "Authenticated users can read recipe tags" on public.recipe_tag_assignments;
create policy "Users can read tags for visible recipes" on public.recipe_tag_assignments
for select to authenticated using (exists (select 1 from public.recipes where recipes.id = recipe_tag_assignments.recipe_id));

drop policy "Household members can create recipe selection explanations" on public.meal_plan_item_selection_explanations;
create policy "Household members can create recipe selection explanations" on public.meal_plan_item_selection_explanations
for insert to authenticated with check (
  exists (
    select 1
    from public.weekly_meal_plan_items
    join public.meal_plan_generation_runs on meal_plan_generation_runs.meal_plan_id = weekly_meal_plan_items.meal_plan_id
    where weekly_meal_plan_items.id = meal_plan_item_id
      and meal_plan_generation_runs.id = generation_run_id
      and public.is_household_member(weekly_meal_plan_items.household_id)
  )
);
