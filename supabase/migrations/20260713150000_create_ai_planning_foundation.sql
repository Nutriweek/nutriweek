create table public.profile_nutrition_targets (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  daily_calorie_target_kcal integer,
  target_source text not null default 'user',
  protein_target_g numeric(8, 2),
  carbohydrates_target_g numeric(8, 2),
  fat_target_g numeric(8, 2),
  fiber_target_g numeric(8, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_nutrition_targets_calories_positive check (daily_calorie_target_kcal is null or daily_calorie_target_kcal > 0),
  constraint profile_nutrition_targets_source_valid check (target_source in ('user', 'estimated'))
);

create table public.profile_cuisine_preferences (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  cuisine_id uuid not null references public.cuisines (id) on delete cascade,
  cuisine_region_id uuid,
  priority smallint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (profile_id, cuisine_id),
  foreign key (cuisine_region_id, cuisine_id) references public.cuisine_regions (id, cuisine_id),
  constraint profile_cuisine_preferences_priority_positive check (priority > 0)
);

create table public.profile_meal_routines (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  day_of_week smallint not null,
  meal_category_id uuid not null references public.meal_categories (id) on delete cascade,
  meal_location text not null default 'home',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, day_of_week, meal_category_id),
  constraint profile_meal_routines_day_valid check (day_of_week between 0 and 6),
  constraint profile_meal_routines_location_valid check (meal_location in ('home', 'office', 'outside', 'travel'))
);

create table public.profile_meal_preferences (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  meal_category_id uuid not null references public.meal_categories (id) on delete cascade,
  max_prep_minutes integer,
  max_cook_minutes integer,
  preference_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (profile_id, meal_category_id),
  constraint profile_meal_preferences_prep_valid check (max_prep_minutes is null or max_prep_minutes >= 0),
  constraint profile_meal_preferences_cook_valid check (max_cook_minutes is null or max_cook_minutes >= 0)
);

create table public.household_planning_preferences (
  household_id uuid primary key references public.households (id) on delete cascade,
  planning_timezone text not null default 'Asia/Kolkata',
  weekly_cooking_holiday smallint,
  preferred_grocery_delivery_day smallint,
  default_max_cook_minutes integer,
  planning_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint household_planning_preferences_holiday_valid check (weekly_cooking_holiday is null or weekly_cooking_holiday between 0 and 6),
  constraint household_planning_preferences_delivery_valid check (preferred_grocery_delivery_day is null or preferred_grocery_delivery_day between 0 and 6),
  constraint household_planning_preferences_cook_valid check (default_max_cook_minutes is null or default_max_cook_minutes >= 0)
);

create table public.household_demographics (
  household_id uuid primary key references public.households (id) on delete cascade,
  kids_count smallint not null default 0,
  elderly_count smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint household_demographics_kids_valid check (kids_count >= 0),
  constraint household_demographics_elderly_valid check (elderly_count >= 0)
);

create table public.household_meal_preferences (
  household_id uuid not null references public.households (id) on delete cascade,
  meal_category_id uuid not null references public.meal_categories (id) on delete cascade,
  max_prep_minutes integer,
  max_cook_minutes integer,
  default_slot_type_id uuid references public.meal_slot_types (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (household_id, meal_category_id),
  constraint household_meal_preferences_prep_valid check (max_prep_minutes is null or max_prep_minutes >= 0),
  constraint household_meal_preferences_cook_valid check (max_cook_minutes is null or max_cook_minutes >= 0)
);

create table public.ingredient_allergens (
  ingredient_id uuid not null references public.ingredients (id) on delete cascade,
  allergen_code text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (ingredient_id, allergen_code)
);

create table public.recipe_diet_compatibilities (
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  diet_type text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (recipe_id, diet_type)
);

create table public.recipe_required_equipment (
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  equipment_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (recipe_id, equipment_name)
);

create table public.recipe_tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.recipe_tag_assignments (
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  tag_id uuid not null references public.recipe_tags (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (recipe_id, tag_id)
);

create table public.ingredient_seasonalities (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references public.ingredients (id) on delete cascade,
  cuisine_region_id uuid references public.cuisine_regions (id) on delete cascade,
  start_month smallint not null,
  end_month smallint not null,
  availability_level text not null default 'peak',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ingredient_seasonalities_start_valid check (start_month between 1 and 12),
  constraint ingredient_seasonalities_end_valid check (end_month between 1 and 12),
  constraint ingredient_seasonalities_availability_valid check (availability_level in ('peak', 'available', 'off_season'))
);

create table public.meal_plan_generation_runs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  meal_plan_id uuid not null references public.weekly_meal_plans (id) on delete cascade,
  generation_source text not null default 'deterministic',
  status text not null default 'completed',
  input_snapshot jsonb not null default '{}'::jsonb,
  output_snapshot jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint meal_plan_generation_runs_source_valid check (generation_source in ('deterministic', 'ai')),
  constraint meal_plan_generation_runs_status_valid check (status in ('completed', 'failed', 'superseded'))
);

create table public.meal_plan_generation_explanations (
  id uuid primary key default gen_random_uuid(),
  generation_run_id uuid not null references public.meal_plan_generation_runs (id) on delete cascade,
  explanation_code text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.meal_plan_item_recipe_snapshots (
  meal_plan_item_id uuid primary key references public.weekly_meal_plan_items (id) on delete cascade,
  recipe_snapshot jsonb not null,
  ingredient_snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create table public.pantry_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  ingredient_id uuid not null references public.ingredients (id) on delete restrict,
  quantity_base numeric(12, 3) not null,
  base_unit_code text not null,
  expires_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pantry_items_quantity_non_negative check (quantity_base >= 0)
);

create table public.grocery_lists (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  weekly_meal_plan_id uuid not null unique references public.weekly_meal_plans (id) on delete cascade,
  status text not null default 'prepared',
  estimated_total numeric(12, 2),
  currency_code char(3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grocery_lists_status_valid check (status in ('prepared', 'adjusted', 'ready_for_order', 'archived')),
  constraint grocery_lists_estimated_total_non_negative check (estimated_total is null or estimated_total >= 0)
);

create table public.grocery_list_items (
  id uuid primary key default gen_random_uuid(),
  grocery_list_id uuid not null references public.grocery_lists (id) on delete cascade,
  ingredient_id uuid references public.ingredients (id) on delete restrict,
  custom_name text,
  generated_quantity_base numeric(12, 3) not null default 0,
  manual_adjustment_quantity_base numeric(12, 3) not null default 0,
  effective_quantity_base numeric(12, 3) not null default 0,
  base_unit_code text not null,
  is_removed boolean not null default false,
  is_custom boolean not null default false,
  estimated_unit_cost numeric(12, 2),
  estimated_total_cost numeric(12, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grocery_list_items_identity check ((ingredient_id is not null and custom_name is null) or (ingredient_id is null and custom_name is not null)),
  constraint grocery_list_items_generated_non_negative check (generated_quantity_base >= 0),
  constraint grocery_list_items_effective_non_negative check (effective_quantity_base >= 0)
);

create unique index grocery_list_items_ingredient_unique on public.grocery_list_items (grocery_list_id, ingredient_id) where ingredient_id is not null;

create table public.grocery_list_item_sources (
  grocery_list_item_id uuid not null references public.grocery_list_items (id) on delete cascade,
  weekly_meal_plan_item_id uuid references public.weekly_meal_plan_items (id) on delete set null,
  recipe_id uuid references public.recipes (id) on delete set null,
  ingredient_id uuid not null references public.ingredients (id) on delete restrict,
  quantity_base numeric(12, 3) not null,
  base_unit_code text not null,
  created_at timestamptz not null default now(),
  primary key (grocery_list_item_id, ingredient_id, weekly_meal_plan_item_id),
  constraint grocery_list_item_sources_quantity_positive check (quantity_base > 0)
);

alter table public.weekly_meal_plans drop constraint weekly_meal_plans_status_valid;
alter table public.weekly_meal_plans add column approved_at timestamptz;
alter table public.weekly_meal_plans add column approved_by uuid references auth.users (id) on delete set null;
alter table public.weekly_meal_plans add column latest_generation_run_id uuid;
alter table public.weekly_meal_plans add constraint weekly_meal_plans_status_valid check (status in ('draft', 'prepared_for_review', 'approved', 'grocery_generated', 'archived'));
alter table public.weekly_meal_plans drop constraint weekly_meal_plans_generation_source_valid;
alter table public.weekly_meal_plans add constraint weekly_meal_plans_generation_source_valid check (generation_source in ('manual', 'deterministic', 'ai'));
alter table public.weekly_meal_plans add foreign key (latest_generation_run_id) references public.meal_plan_generation_runs (id) on delete set null;

create index profile_meal_routines_profile_idx on public.profile_meal_routines (profile_id, day_of_week);
create index ingredient_allergens_allergen_idx on public.ingredient_allergens (allergen_code);
create index recipe_diet_compatibilities_diet_idx on public.recipe_diet_compatibilities (diet_type);
create index recipe_required_equipment_equipment_idx on public.recipe_required_equipment (equipment_name);
create index recipe_tag_assignments_tag_idx on public.recipe_tag_assignments (tag_id);
create index ingredient_seasonalities_ingredient_idx on public.ingredient_seasonalities (ingredient_id);
create index meal_plan_generation_runs_plan_idx on public.meal_plan_generation_runs (meal_plan_id, created_at desc);
create index meal_plan_generation_explanations_run_idx on public.meal_plan_generation_explanations (generation_run_id);
create index pantry_items_household_ingredient_idx on public.pantry_items (household_id, ingredient_id);
create index grocery_lists_household_created_idx on public.grocery_lists (household_id, created_at desc);
create index grocery_list_items_list_idx on public.grocery_list_items (grocery_list_id);

create function public.validate_weekly_meal_plan_item()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  slot_requires_recipe boolean;
begin
  select requires_recipe into slot_requires_recipe
  from public.meal_slot_types
  where id = new.meal_slot_type_id;

  if slot_requires_recipe and new.recipe_id is null then
    raise exception 'A recipe slot requires a recipe.';
  end if;

  return new;
end;
$$;

create trigger weekly_meal_plan_items_validate_slot
before insert or update on public.weekly_meal_plan_items
for each row execute function public.validate_weekly_meal_plan_item();

create trigger profile_nutrition_targets_set_updated_at before update on public.profile_nutrition_targets for each row execute function public.set_updated_at();
create trigger profile_cuisine_preferences_set_updated_at before update on public.profile_cuisine_preferences for each row execute function public.set_updated_at();
create trigger profile_meal_routines_set_updated_at before update on public.profile_meal_routines for each row execute function public.set_updated_at();
create trigger profile_meal_preferences_set_updated_at before update on public.profile_meal_preferences for each row execute function public.set_updated_at();
create trigger household_planning_preferences_set_updated_at before update on public.household_planning_preferences for each row execute function public.set_updated_at();
create trigger household_demographics_set_updated_at before update on public.household_demographics for each row execute function public.set_updated_at();
create trigger household_meal_preferences_set_updated_at before update on public.household_meal_preferences for each row execute function public.set_updated_at();
create trigger pantry_items_set_updated_at before update on public.pantry_items for each row execute function public.set_updated_at();
create trigger grocery_lists_set_updated_at before update on public.grocery_lists for each row execute function public.set_updated_at();
create trigger grocery_list_items_set_updated_at before update on public.grocery_list_items for each row execute function public.set_updated_at();

alter table public.profile_nutrition_targets enable row level security;
alter table public.profile_cuisine_preferences enable row level security;
alter table public.profile_meal_routines enable row level security;
alter table public.profile_meal_preferences enable row level security;
alter table public.household_planning_preferences enable row level security;
alter table public.household_demographics enable row level security;
alter table public.household_meal_preferences enable row level security;
alter table public.ingredient_allergens enable row level security;
alter table public.recipe_diet_compatibilities enable row level security;
alter table public.recipe_required_equipment enable row level security;
alter table public.recipe_tags enable row level security;
alter table public.recipe_tag_assignments enable row level security;
alter table public.ingredient_seasonalities enable row level security;
alter table public.meal_plan_generation_runs enable row level security;
alter table public.meal_plan_generation_explanations enable row level security;
alter table public.meal_plan_item_recipe_snapshots enable row level security;
alter table public.pantry_items enable row level security;
alter table public.grocery_lists enable row level security;
alter table public.grocery_list_items enable row level security;
alter table public.grocery_list_item_sources enable row level security;

create policy "Users can manage their nutrition targets" on public.profile_nutrition_targets for all to authenticated using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));
create policy "Users can manage their cuisine preferences" on public.profile_cuisine_preferences for all to authenticated using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));
create policy "Users can manage their meal routines" on public.profile_meal_routines for all to authenticated using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));
create policy "Users can manage their meal preferences" on public.profile_meal_preferences for all to authenticated using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));
create policy "Household members can read planning preferences" on public.household_planning_preferences for select to authenticated using (public.is_household_member(household_id));
create policy "Household members can manage planning preferences" on public.household_planning_preferences for all to authenticated using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
create policy "Household members can read demographics" on public.household_demographics for select to authenticated using (public.is_household_member(household_id));
create policy "Household members can manage demographics" on public.household_demographics for all to authenticated using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
create policy "Household members can manage meal preferences" on public.household_meal_preferences for all to authenticated using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
create policy "Authenticated users can read planning recipe metadata" on public.ingredient_allergens for select to authenticated using (true);
create policy "Authenticated users can read recipe diet metadata" on public.recipe_diet_compatibilities for select to authenticated using (true);
create policy "Authenticated users can read recipe equipment metadata" on public.recipe_required_equipment for select to authenticated using (true);
create policy "Authenticated users can read active recipe tags" on public.recipe_tags for select to authenticated using (is_active);
create policy "Authenticated users can read recipe tags" on public.recipe_tag_assignments for select to authenticated using (true);
create policy "Authenticated users can read ingredient seasonality" on public.ingredient_seasonalities for select to authenticated using (true);
create policy "Household members can read generation runs" on public.meal_plan_generation_runs for select to authenticated using (public.is_household_member(household_id));
create policy "Household members can create generation runs" on public.meal_plan_generation_runs for insert to authenticated with check (public.is_household_member(household_id));
create policy "Household members can read generation explanations" on public.meal_plan_generation_explanations for select to authenticated using (exists (select 1 from public.meal_plan_generation_runs where id = generation_run_id));
create policy "Household members can create generation explanations" on public.meal_plan_generation_explanations for insert to authenticated with check (exists (select 1 from public.meal_plan_generation_runs where id = generation_run_id));
create policy "Household members can read recipe snapshots" on public.meal_plan_item_recipe_snapshots for select to authenticated using (exists (select 1 from public.weekly_meal_plan_items where id = meal_plan_item_id and public.is_household_member(household_id)));
create policy "Household members can create recipe snapshots" on public.meal_plan_item_recipe_snapshots for insert to authenticated with check (exists (select 1 from public.weekly_meal_plan_items where id = meal_plan_item_id and public.is_household_member(household_id)));
create policy "Household members can manage pantry items" on public.pantry_items for all to authenticated using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
create policy "Household members can manage grocery lists" on public.grocery_lists for all to authenticated using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
create policy "Household members can manage grocery items" on public.grocery_list_items for all to authenticated using (exists (select 1 from public.grocery_lists where id = grocery_list_id and public.is_household_member(household_id))) with check (exists (select 1 from public.grocery_lists where id = grocery_list_id and public.is_household_member(household_id)));
create policy "Household members can read grocery sources" on public.grocery_list_item_sources for select to authenticated using (exists (select 1 from public.grocery_list_items join public.grocery_lists on grocery_lists.id = grocery_list_items.grocery_list_id where grocery_list_items.id = grocery_list_item_id and public.is_household_member(grocery_lists.household_id)));
create policy "Household members can create grocery sources" on public.grocery_list_item_sources for insert to authenticated with check (exists (select 1 from public.grocery_list_items join public.grocery_lists on grocery_lists.id = grocery_list_items.grocery_list_id where grocery_list_items.id = grocery_list_item_id and public.is_household_member(grocery_lists.household_id)));

grant select, insert, update, delete on public.profile_nutrition_targets, public.profile_cuisine_preferences, public.profile_meal_routines, public.profile_meal_preferences, public.household_planning_preferences, public.household_demographics, public.household_meal_preferences to authenticated;
grant select on public.ingredient_allergens, public.recipe_diet_compatibilities, public.recipe_required_equipment, public.recipe_tags, public.recipe_tag_assignments, public.ingredient_seasonalities to authenticated;
grant select, insert on public.meal_plan_generation_runs, public.meal_plan_generation_explanations, public.meal_plan_item_recipe_snapshots to authenticated;
grant select, insert, update, delete on public.pantry_items, public.grocery_lists, public.grocery_list_items, public.grocery_list_item_sources to authenticated;

drop policy "Household members can create weekly plan items" on public.weekly_meal_plan_items;
drop policy "Household members can update weekly plan items" on public.weekly_meal_plan_items;
create policy "Household members can create valid weekly plan items" on public.weekly_meal_plan_items for insert to authenticated with check (
  public.is_household_member(household_id)
  and (recipe_id is null or exists (select 1 from public.recipes where recipes.id = weekly_meal_plan_items.recipe_id))
);
create policy "Household members can update valid weekly plan items" on public.weekly_meal_plan_items for update to authenticated using (public.is_household_member(household_id)) with check (
  public.is_household_member(household_id)
  and (recipe_id is null or exists (select 1 from public.recipes where recipes.id = weekly_meal_plan_items.recipe_id))
);
