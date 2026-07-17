create function public.validate_grocery_list_weekly_meal_plan()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.weekly_meal_plans
    where id = new.weekly_meal_plan_id
      and household_id = new.household_id
  ) then
    raise exception 'A grocery list must belong to a weekly meal plan in the same household.';
  end if;

  return new;
end;
$$;

create function public.validate_grocery_list_item_source_weekly_meal_plan()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.grocery_list_items
    join public.grocery_lists on grocery_lists.id = grocery_list_items.grocery_list_id
    join public.weekly_meal_plan_items on weekly_meal_plan_items.id = new.weekly_meal_plan_item_id
    where grocery_list_items.id = new.grocery_list_item_id
      and grocery_list_items.ingredient_id = new.ingredient_id
      and weekly_meal_plan_items.meal_plan_id = grocery_lists.weekly_meal_plan_id
      and weekly_meal_plan_items.recipe_id is not distinct from new.recipe_id
  ) then
    raise exception 'A grocery item source must belong to its grocery list weekly meal plan.';
  end if;

  return new;
end;
$$;

create trigger grocery_lists_validate_weekly_meal_plan
before insert or update of household_id, weekly_meal_plan_id on public.grocery_lists
for each row execute function public.validate_grocery_list_weekly_meal_plan();

create trigger grocery_list_item_sources_validate_weekly_meal_plan
before insert or update of grocery_list_item_id, weekly_meal_plan_item_id, recipe_id, ingredient_id on public.grocery_list_item_sources
for each row execute function public.validate_grocery_list_item_source_weekly_meal_plan();
