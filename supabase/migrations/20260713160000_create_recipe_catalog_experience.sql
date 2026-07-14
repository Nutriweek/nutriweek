alter table public.recipes
  add column slug text,
  add column total_time_minutes integer,
  add column publication_status text not null default 'draft',
  add column quality_status text not null default 'draft',
  add column cover_image_path text,
  add column nutrition_source text,
  add column nutrition_status text not null default 'unverified',
  add column nutrition_updated_at timestamptz,
  add column estimated_cost numeric(12, 2),
  add column estimated_cost_currency char(3),
  add column estimated_cost_calculated_at timestamptz,
  add column source_id text,
  add column source_metadata jsonb not null default '{}'::jsonb;

alter table public.recipes
  add constraint recipes_slug_lowercase check (slug is null or slug = lower(slug)),
  add constraint recipes_total_time_non_negative check (total_time_minutes is null or total_time_minutes >= 0),
  add constraint recipes_publication_status_valid check (publication_status in ('draft', 'published', 'archived', 'rejected')),
  add constraint recipes_quality_status_valid check (quality_status in ('draft', 'reviewed', 'verified')),
  add constraint recipes_nutrition_status_valid check (nutrition_status in ('unverified', 'reviewed', 'verified')),
  add constraint recipes_cost_non_negative check (estimated_cost is null or estimated_cost >= 0),
  add constraint recipes_cost_currency_pair check ((estimated_cost is null) = (estimated_cost_currency is null));

create unique index recipes_slug_unique on public.recipes (slug) where slug is not null;
create index recipes_catalog_browse_idx on public.recipes (publication_status, quality_status, is_active, name) where is_active;

create table public.recipe_sources (
  id text primary key,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.recipe_sources (id, name) values
  ('system', 'Nutriweek'),
  ('user', 'User'),
  ('ai', 'AI'),
  ('partner', 'Partner'),
  ('nutritionist', 'Nutritionist'),
  ('chef', 'Chef');

update public.recipes set source_id = source_type::text where source_id is null;
alter table public.recipes add constraint recipes_source_id_fkey foreign key (source_id) references public.recipe_sources (id) on delete restrict;

create table public.recipe_meal_categories (
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  meal_category_id uuid not null references public.meal_categories (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (recipe_id, meal_category_id)
);

create table public.recipe_steps (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  step_number smallint not null,
  instruction text not null,
  estimated_duration_minutes integer,
  tip text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (recipe_id, step_number),
  constraint recipe_steps_number_positive check (step_number > 0),
  constraint recipe_steps_duration_non_negative check (estimated_duration_minutes is null or estimated_duration_minutes >= 0),
  constraint recipe_steps_instruction_not_blank check (length(trim(instruction)) > 0)
);

create table public.recipe_step_media (
  id uuid primary key default gen_random_uuid(),
  recipe_step_id uuid not null references public.recipe_steps (id) on delete cascade,
  media_type text not null,
  storage_path text not null,
  alt_text text,
  display_order smallint not null default 0,
  created_at timestamptz not null default now(),
  unique (recipe_step_id, display_order),
  constraint recipe_step_media_type_valid check (media_type in ('image', 'video')),
  constraint recipe_step_media_path_not_blank check (length(trim(storage_path)) > 0)
);

create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint equipment_slug_lowercase check (slug = lower(slug))
);

create table public.recipe_equipment_requirements (
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  equipment_id uuid not null references public.equipment (id) on delete restrict,
  is_required boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (recipe_id, equipment_id)
);

insert into public.equipment (slug, name)
select distinct trim(both '-' from regexp_replace(lower(equipment_name), '[^a-z0-9]+', '-', 'g')), equipment_name
from public.recipe_required_equipment
on conflict (slug) do nothing;

insert into public.recipe_equipment_requirements (recipe_id, equipment_id)
select requirements.recipe_id, equipment.id
from public.recipe_required_equipment as requirements
join public.equipment on equipment.slug = trim(both '-' from regexp_replace(lower(requirements.equipment_name), '[^a-z0-9]+', '-', 'g'))
on conflict do nothing;

alter table public.recipe_tags add column category text not null default 'general';
alter table public.recipe_tags add constraint recipe_tags_category_valid check (category in ('general', 'suitability', 'leftovers', 'nutrition', 'occasion', 'workflow'));

create table public.ingredient_aliases (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references public.ingredients (id) on delete cascade,
  normalized_name text not null unique,
  display_name text not null,
  locale text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ingredient_aliases_normalized_lowercase check (normalized_name = lower(normalized_name))
);

create table public.nutrients (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  unit_code text not null,
  category text not null default 'micronutrient',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nutrients_category_valid check (category in ('macronutrient', 'micronutrient', 'other'))
);

create table public.recipe_nutrient_values (
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  nutrient_id uuid not null references public.nutrients (id) on delete restrict,
  amount numeric(12, 4) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (recipe_id, nutrient_id),
  constraint recipe_nutrient_values_non_negative check (amount >= 0)
);

create table public.recipe_quality_scores (
  recipe_id uuid primary key references public.recipes (id) on delete cascade,
  score smallint not null,
  components jsonb not null default '{}'::jsonb,
  calculated_at timestamptz not null default now(),
  constraint recipe_quality_scores_range check (score between 0 and 100)
);

create table public.meal_plan_item_selection_explanations (
  id uuid primary key default gen_random_uuid(),
  meal_plan_item_id uuid not null references public.weekly_meal_plan_items (id) on delete cascade,
  generation_run_id uuid not null references public.meal_plan_generation_runs (id) on delete cascade,
  explanation_code text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (meal_plan_item_id, generation_run_id, explanation_code)
);

create index recipe_meal_categories_category_idx on public.recipe_meal_categories (meal_category_id, recipe_id);
create index recipe_steps_recipe_order_idx on public.recipe_steps (recipe_id, step_number);
create index recipe_equipment_requirements_equipment_idx on public.recipe_equipment_requirements (equipment_id, recipe_id);
create index ingredient_aliases_ingredient_idx on public.ingredient_aliases (ingredient_id);
create index recipe_nutrient_values_nutrient_idx on public.recipe_nutrient_values (nutrient_id, recipe_id);
create index recipe_quality_scores_score_idx on public.recipe_quality_scores (score desc);
create index meal_plan_item_selection_explanations_item_idx on public.meal_plan_item_selection_explanations (meal_plan_item_id);

create function public.recalculate_recipe_quality(target_recipe_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_recipe public.recipes%rowtype;
  ingredient_count integer := 0;
  normalized_ingredient_count integer := 0;
  step_count integer := 0;
  equipment_count integer := 0;
  nutrition_complete boolean := false;
  score_value smallint := 0;
begin
  select * into target_recipe from public.recipes where id = target_recipe_id;
  if not found then
    delete from public.recipe_quality_scores where recipe_id = target_recipe_id;
    return;
  end if;

  select count(*), count(*) filter (where base_quantity is not null and base_unit_code is not null)
  into ingredient_count, normalized_ingredient_count
  from public.recipe_ingredients where recipe_id = target_recipe_id;
  select count(*) into step_count from public.recipe_steps where recipe_id = target_recipe_id;
  select count(*) into equipment_count from public.recipe_equipment_requirements where recipe_id = target_recipe_id;
  nutrition_complete := target_recipe.calories_kcal is not null and target_recipe.protein_g is not null
    and target_recipe.carbohydrates_g is not null and target_recipe.fat_g is not null
    and target_recipe.fiber_g is not null and target_recipe.sugar_g is not null and target_recipe.sodium_mg is not null;

  score_value := score_value + case when ingredient_count > 0 and ingredient_count = normalized_ingredient_count then 15 else 0 end;
  score_value := score_value + case when nutrition_complete then 15 else 0 end;
  score_value := score_value + case when target_recipe.nutrition_status = 'verified' then 15 else 0 end;
  score_value := score_value + case when equipment_count > 0 then 5 else 0 end;
  score_value := score_value + case when step_count >= 2 then 15 else 0 end;
  score_value := score_value + case when target_recipe.prep_time_minutes is not null and target_recipe.cook_time_minutes is not null then 10 else 0 end;
  score_value := score_value + case when target_recipe.cover_image_path is not null then 5 else 0 end;
  score_value := score_value + case when target_recipe.quality_status in ('reviewed', 'verified') then 20 else 0 end;

  insert into public.recipe_quality_scores (recipe_id, score, components, calculated_at)
  values (target_recipe_id, score_value, jsonb_build_object(
    'ingredients_normalized', ingredient_count > 0 and ingredient_count = normalized_ingredient_count,
    'nutrition_complete', nutrition_complete,
    'nutrition_verified', target_recipe.nutrition_status = 'verified',
    'equipment_defined', equipment_count > 0,
    'steps_complete', step_count >= 2,
    'times_complete', target_recipe.prep_time_minutes is not null and target_recipe.cook_time_minutes is not null,
    'image_available', target_recipe.cover_image_path is not null,
    'editorially_reviewed', target_recipe.quality_status in ('reviewed', 'verified')
  ), now())
  on conflict (recipe_id) do update set score = excluded.score, components = excluded.components, calculated_at = excluded.calculated_at;
end;
$$;

create function public.recalculate_recipe_estimated_cost(target_recipe_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  missing_cost boolean;
  multiple_currencies boolean;
  total_cost numeric(12, 2);
  target_currency char(3);
begin
  select
    count(*) filter (where not is_optional) > 0 and count(*) filter (where not is_optional and (base_quantity is null or base_unit_code is null or estimated_unit_cost is null or cost_currency is null)) > 0,
    count(distinct cost_currency) filter (where not is_optional and estimated_unit_cost is not null) > 1,
    sum(base_quantity * estimated_unit_cost) filter (where not is_optional),
    min(cost_currency) filter (where not is_optional and estimated_unit_cost is not null)
  into missing_cost, multiple_currencies, total_cost, target_currency
  from public.recipe_ingredients
  join public.ingredients on ingredients.id = recipe_ingredients.ingredient_id
  where recipe_ingredients.recipe_id = target_recipe_id;

  update public.recipes
  set estimated_cost = case when missing_cost or multiple_currencies then null else total_cost end,
      estimated_cost_currency = case when missing_cost or multiple_currencies then null else target_currency end,
      estimated_cost_calculated_at = now()
  where id = target_recipe_id;
end;
$$;

create function public.refresh_recipe_quality_from_recipe()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.recalculate_recipe_quality(new.id);
  return new;
end;
$$;

create function public.refresh_recipe_quality_from_child()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.recalculate_recipe_quality(coalesce(new.recipe_id, old.recipe_id));
  return coalesce(new, old);
end;
$$;

create function public.refresh_recipe_cost_from_ingredient()
returns trigger language plpgsql security definer set search_path = public as $$
declare recipe_id_value uuid;
begin
  for recipe_id_value in select recipe_id from public.recipe_ingredients where ingredient_id = new.id loop
    perform public.recalculate_recipe_estimated_cost(recipe_id_value);
  end loop;
  return new;
end;
$$;

create trigger recipes_refresh_quality after insert or update of calories_kcal, protein_g, carbohydrates_g, fat_g, fiber_g, sugar_g, sodium_mg, nutrition_status, quality_status, prep_time_minutes, cook_time_minutes, cover_image_path on public.recipes
for each row execute function public.refresh_recipe_quality_from_recipe();
create trigger recipe_ingredients_refresh_quality after insert or update or delete on public.recipe_ingredients
for each row execute function public.refresh_recipe_quality_from_child();
create trigger recipe_steps_refresh_quality after insert or update or delete on public.recipe_steps
for each row execute function public.refresh_recipe_quality_from_child();
create trigger recipe_equipment_requirements_refresh_quality after insert or update or delete on public.recipe_equipment_requirements
for each row execute function public.refresh_recipe_quality_from_child();
create trigger recipe_ingredients_refresh_cost after insert or update or delete on public.recipe_ingredients
for each row execute function public.refresh_recipe_quality_from_child();
create trigger ingredients_refresh_recipe_cost after update of estimated_unit_cost, cost_currency on public.ingredients
for each row execute function public.refresh_recipe_cost_from_ingredient();

alter table public.recipe_sources enable row level security;
alter table public.recipe_meal_categories enable row level security;
alter table public.recipe_steps enable row level security;
alter table public.recipe_step_media enable row level security;
alter table public.equipment enable row level security;
alter table public.recipe_equipment_requirements enable row level security;
alter table public.ingredient_aliases enable row level security;
alter table public.nutrients enable row level security;
alter table public.recipe_nutrient_values enable row level security;
alter table public.recipe_quality_scores enable row level security;
alter table public.meal_plan_item_selection_explanations enable row level security;

create policy "Authenticated users can read active recipe sources" on public.recipe_sources for select to authenticated using (is_active);
create policy "Users can read meal categories for visible recipes" on public.recipe_meal_categories for select to authenticated using (exists (select 1 from public.recipes where recipes.id = recipe_meal_categories.recipe_id));
create policy "Users can manage meal categories for their recipes" on public.recipe_meal_categories for all to authenticated using (exists (select 1 from public.recipes where recipes.id = recipe_meal_categories.recipe_id and recipes.source_type = 'user' and recipes.created_by = (select auth.uid()))) with check (exists (select 1 from public.recipes where recipes.id = recipe_meal_categories.recipe_id and recipes.source_type = 'user' and recipes.created_by = (select auth.uid())));
create policy "Users can read steps for visible recipes" on public.recipe_steps for select to authenticated using (exists (select 1 from public.recipes where recipes.id = recipe_steps.recipe_id));
create policy "Users can manage steps for their recipes" on public.recipe_steps for all to authenticated using (exists (select 1 from public.recipes where recipes.id = recipe_steps.recipe_id and recipes.source_type = 'user' and recipes.created_by = (select auth.uid()))) with check (exists (select 1 from public.recipes where recipes.id = recipe_steps.recipe_id and recipes.source_type = 'user' and recipes.created_by = (select auth.uid())));
create policy "Users can read step media for visible recipes" on public.recipe_step_media for select to authenticated using (exists (select 1 from public.recipe_steps join public.recipes on recipes.id = recipe_steps.recipe_id where recipe_steps.id = recipe_step_media.recipe_step_id));
create policy "Users can manage step media for their recipes" on public.recipe_step_media for all to authenticated using (exists (select 1 from public.recipe_steps join public.recipes on recipes.id = recipe_steps.recipe_id where recipe_steps.id = recipe_step_media.recipe_step_id and recipes.source_type = 'user' and recipes.created_by = (select auth.uid()))) with check (exists (select 1 from public.recipe_steps join public.recipes on recipes.id = recipe_steps.recipe_id where recipe_steps.id = recipe_step_media.recipe_step_id and recipes.source_type = 'user' and recipes.created_by = (select auth.uid())));
create policy "Authenticated users can read active equipment" on public.equipment for select to authenticated using (is_active);
create policy "Users can read equipment for visible recipes" on public.recipe_equipment_requirements for select to authenticated using (exists (select 1 from public.recipes where recipes.id = recipe_equipment_requirements.recipe_id));
create policy "Users can manage equipment for their recipes" on public.recipe_equipment_requirements for all to authenticated using (exists (select 1 from public.recipes where recipes.id = recipe_equipment_requirements.recipe_id and recipes.source_type = 'user' and recipes.created_by = (select auth.uid()))) with check (exists (select 1 from public.recipes where recipes.id = recipe_equipment_requirements.recipe_id and recipes.source_type = 'user' and recipes.created_by = (select auth.uid())));
create policy "Authenticated users can read active ingredient aliases" on public.ingredient_aliases for select to authenticated using (is_active);
create policy "Authenticated users can read active nutrients" on public.nutrients for select to authenticated using (is_active);
create policy "Users can read nutrients for visible recipes" on public.recipe_nutrient_values for select to authenticated using (exists (select 1 from public.recipes where recipes.id = recipe_nutrient_values.recipe_id));
create policy "Users can manage nutrients for their recipes" on public.recipe_nutrient_values for all to authenticated using (exists (select 1 from public.recipes where recipes.id = recipe_nutrient_values.recipe_id and recipes.source_type = 'user' and recipes.created_by = (select auth.uid()))) with check (exists (select 1 from public.recipes where recipes.id = recipe_nutrient_values.recipe_id and recipes.source_type = 'user' and recipes.created_by = (select auth.uid())));
create policy "Users can read quality scores for visible recipes" on public.recipe_quality_scores for select to authenticated using (exists (select 1 from public.recipes where recipes.id = recipe_quality_scores.recipe_id));
create policy "Household members can read recipe selection explanations" on public.meal_plan_item_selection_explanations for select to authenticated using (exists (select 1 from public.weekly_meal_plan_items where id = meal_plan_item_id and public.is_household_member(household_id)));
create policy "Household members can create recipe selection explanations" on public.meal_plan_item_selection_explanations for insert to authenticated with check (exists (select 1 from public.weekly_meal_plan_items where id = meal_plan_item_id and public.is_household_member(household_id)));

grant select on public.recipe_sources, public.equipment, public.ingredient_aliases, public.nutrients, public.recipe_quality_scores to authenticated;
grant select, insert, update, delete on public.recipe_meal_categories, public.recipe_steps, public.recipe_step_media, public.recipe_equipment_requirements, public.recipe_nutrient_values to authenticated;
grant select, insert on public.meal_plan_item_selection_explanations to authenticated;
grant execute on function public.recalculate_recipe_quality(uuid), public.recalculate_recipe_estimated_cost(uuid) to authenticated;

insert into public.recipe_tags (slug, name, category) values
  ('kids-friendly', 'Kids Friendly', 'suitability'),
  ('elderly-friendly', 'Elderly Friendly', 'suitability'),
  ('pregnancy-friendly', 'Pregnancy Friendly', 'suitability'),
  ('diabetic-friendly', 'Diabetic Friendly', 'suitability'),
  ('high-protein', 'High Protein', 'nutrition'),
  ('low-sodium', 'Low Sodium', 'nutrition'),
  ('weight-loss', 'Weight Loss', 'suitability'),
  ('muscle-gain', 'Muscle Gain', 'suitability'),
  ('freezer-friendly', 'Freezer Friendly', 'leftovers'),
  ('leftover-friendly', 'Leftover Friendly', 'leftovers'),
  ('reheat-friendly', 'Reheat Friendly', 'leftovers'),
  ('meal-prep-friendly', 'Meal Prep Friendly', 'workflow'),
  ('batch-cook-friendly', 'Batch Cook Friendly', 'workflow'),
  ('budget-friendly', 'Budget Friendly', 'nutrition'),
  ('quick-meal', 'Quick Meal', 'workflow'),
  ('one-pot', 'One Pot', 'workflow'),
  ('office-lunch', 'Office Lunch', 'workflow')
on conflict (slug) do update set name = excluded.name, category = excluded.category;

insert into public.nutrients (code, name, unit_code, category) values
  ('vitamin_a_ug', 'Vitamin A', 'ug', 'micronutrient'),
  ('vitamin_c_mg', 'Vitamin C', 'mg', 'micronutrient'),
  ('calcium_mg', 'Calcium', 'mg', 'micronutrient'),
  ('iron_mg', 'Iron', 'mg', 'micronutrient'),
  ('potassium_mg', 'Potassium', 'mg', 'micronutrient')
on conflict (code) do nothing;

update public.recipes set total_time_minutes = coalesce(prep_time_minutes, 0) + coalesce(cook_time_minutes, 0) where total_time_minutes is null and (prep_time_minutes is not null or cook_time_minutes is not null);
select public.recalculate_recipe_quality(id) from public.recipes;
select public.recalculate_recipe_estimated_cost(id) from public.recipes;
