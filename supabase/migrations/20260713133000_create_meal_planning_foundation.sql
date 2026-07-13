create type public.recipe_source_type as enum ('system', 'user', 'ai');
create type public.recipe_visibility as enum ('system', 'public', 'private');

create table public.cuisines (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cuisine_regions (
  id uuid primary key default gen_random_uuid(),
  cuisine_id uuid not null references public.cuisines (id) on delete cascade,
  parent_id uuid references public.cuisine_regions (id) on delete restrict,
  slug text not null,
  name text not null,
  region_type text not null,
  country_code char(2),
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cuisine_id, slug),
  unique (id, cuisine_id)
);

create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  ingredient_category text,
  default_unit_code text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meal_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meal_slot_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  requires_recipe boolean not null default false,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  source_type public.recipe_source_type not null default 'user',
  visibility public.recipe_visibility not null default 'private',
  created_by uuid references auth.users (id) on delete set null,
  name text not null,
  description text,
  primary_cuisine_id uuid references public.cuisines (id) on delete set null,
  primary_cuisine_region_id uuid,
  servings numeric(7, 2),
  difficulty text,
  prep_time_minutes integer,
  cook_time_minutes integer,
  instructions text,
  calories_kcal numeric(10, 2),
  protein_g numeric(10, 2),
  carbohydrates_g numeric(10, 2),
  fat_g numeric(10, 2),
  fiber_g numeric(10, 2),
  sugar_g numeric(10, 2),
  sodium_mg numeric(10, 2),
  is_active boolean not null default true,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (primary_cuisine_region_id, primary_cuisine_id)
    references public.cuisine_regions (id, cuisine_id),
  constraint recipes_source_ownership check (
    (source_type = 'system' and created_by is null and visibility = 'system')
    or (source_type = 'user' and created_by is not null and visibility in ('public', 'private'))
    or source_type = 'ai'
  ),
  constraint recipes_servings_positive check (servings is null or servings > 0),
  constraint recipes_prep_time_non_negative check (prep_time_minutes is null or prep_time_minutes >= 0),
  constraint recipes_cook_time_non_negative check (cook_time_minutes is null or cook_time_minutes >= 0),
  constraint recipes_nutrition_non_negative check (
    (calories_kcal is null or calories_kcal >= 0)
    and (protein_g is null or protein_g >= 0)
    and (carbohydrates_g is null or carbohydrates_g >= 0)
    and (fat_g is null or fat_g >= 0)
    and (fiber_g is null or fiber_g >= 0)
    and (sugar_g is null or sugar_g >= 0)
    and (sodium_mg is null or sodium_mg >= 0)
  )
);

create table public.recipe_cuisines (
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  cuisine_id uuid not null references public.cuisines (id) on delete cascade,
  cuisine_region_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (recipe_id, cuisine_id),
  foreign key (cuisine_region_id, cuisine_id)
    references public.cuisine_regions (id, cuisine_id)
);

create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  ingredient_id uuid not null references public.ingredients (id) on delete restrict,
  quantity numeric(12, 3) not null,
  unit_code text not null,
  base_quantity numeric(12, 3),
  base_unit_code text,
  is_optional boolean not null default false,
  preparation_note text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recipe_ingredients_quantity_positive check (quantity > 0),
  constraint recipe_ingredients_base_quantity_positive check (base_quantity is null or base_quantity > 0),
  constraint recipe_ingredients_base_unit_pair check (
    (base_quantity is null) = (base_unit_code is null)
  )
);

create table public.recipe_household_access (
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  household_id uuid not null references public.households (id) on delete cascade,
  access_level text not null default 'view',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (recipe_id, household_id)
);

create table public.weekly_meal_plans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  week_start_date date not null,
  status text not null default 'draft',
  generation_source text not null default 'manual',
  generation_context jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, week_start_date),
  unique (id, household_id),
  constraint weekly_meal_plans_status_valid check (status in ('draft', 'active', 'archived')),
  constraint weekly_meal_plans_generation_source_valid check (generation_source in ('manual', 'ai'))
);

create table public.weekly_meal_plan_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  meal_plan_id uuid not null,
  meal_date date not null,
  meal_category_id uuid not null references public.meal_categories (id) on delete restrict,
  meal_slot_type_id uuid not null references public.meal_slot_types (id) on delete restrict,
  recipe_id uuid references public.recipes (id) on delete set null,
  servings numeric(7, 2),
  title text,
  notes text,
  slot_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (meal_plan_id, household_id)
    references public.weekly_meal_plans (id, household_id) on delete cascade,
  unique (meal_plan_id, meal_date, meal_category_id, slot_index),
  constraint weekly_meal_plan_items_servings_positive check (servings is null or servings > 0)
);

create index cuisine_regions_cuisine_parent_idx on public.cuisine_regions (cuisine_id, parent_id, display_order);
create index ingredients_category_idx on public.ingredients (ingredient_category) where is_active;
create index recipes_primary_cuisine_idx on public.recipes (primary_cuisine_id, primary_cuisine_region_id) where is_active;
create index recipes_visibility_idx on public.recipes (visibility, source_type) where is_active;
create index recipes_created_by_idx on public.recipes (created_by) where created_by is not null;
create index recipe_cuisines_cuisine_idx on public.recipe_cuisines (cuisine_id, cuisine_region_id);
create index recipe_ingredients_recipe_idx on public.recipe_ingredients (recipe_id, display_order);
create index recipe_ingredients_ingredient_idx on public.recipe_ingredients (ingredient_id);
create index recipe_household_access_household_idx on public.recipe_household_access (household_id);
create index weekly_meal_plans_household_week_idx on public.weekly_meal_plans (household_id, week_start_date desc);
create index weekly_meal_plan_items_household_date_idx on public.weekly_meal_plan_items (household_id, meal_date);
create index weekly_meal_plan_items_recipe_idx on public.weekly_meal_plan_items (recipe_id) where recipe_id is not null;

create trigger cuisines_set_updated_at before update on public.cuisines
for each row execute function public.set_updated_at();
create trigger cuisine_regions_set_updated_at before update on public.cuisine_regions
for each row execute function public.set_updated_at();
create trigger ingredients_set_updated_at before update on public.ingredients
for each row execute function public.set_updated_at();
create trigger meal_categories_set_updated_at before update on public.meal_categories
for each row execute function public.set_updated_at();
create trigger meal_slot_types_set_updated_at before update on public.meal_slot_types
for each row execute function public.set_updated_at();
create trigger recipes_set_updated_at before update on public.recipes
for each row execute function public.set_updated_at();
create trigger recipe_cuisines_set_updated_at before update on public.recipe_cuisines
for each row execute function public.set_updated_at();
create trigger recipe_ingredients_set_updated_at before update on public.recipe_ingredients
for each row execute function public.set_updated_at();
create trigger recipe_household_access_set_updated_at before update on public.recipe_household_access
for each row execute function public.set_updated_at();
create trigger weekly_meal_plans_set_updated_at before update on public.weekly_meal_plans
for each row execute function public.set_updated_at();
create trigger weekly_meal_plan_items_set_updated_at before update on public.weekly_meal_plan_items
for each row execute function public.set_updated_at();

create function public.is_household_member(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members
    where household_id = target_household_id
      and user_id = (select auth.uid())
  );
$$;

alter table public.cuisines enable row level security;
alter table public.cuisine_regions enable row level security;
alter table public.ingredients enable row level security;
alter table public.meal_categories enable row level security;
alter table public.meal_slot_types enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_cuisines enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.recipe_household_access enable row level security;
alter table public.weekly_meal_plans enable row level security;
alter table public.weekly_meal_plan_items enable row level security;

create policy "Authenticated users can read active cuisines" on public.cuisines
for select to authenticated using (is_active);
create policy "Authenticated users can read active cuisine regions" on public.cuisine_regions
for select to authenticated using (is_active);
create policy "Authenticated users can read active ingredients" on public.ingredients
for select to authenticated using (is_active);
create policy "Authenticated users can read active meal categories" on public.meal_categories
for select to authenticated using (is_active);
create policy "Authenticated users can read active meal slot types" on public.meal_slot_types
for select to authenticated using (is_active);

create policy "Users can read visible recipes" on public.recipes
for select to authenticated using (
  (is_active and visibility in ('system', 'public'))
  or created_by = (select auth.uid())
  or exists (
    select 1 from public.recipe_household_access
    where recipe_household_access.recipe_id = recipes.id
      and public.is_household_member(recipe_household_access.household_id)
  )
);
create policy "Users can create their own recipes" on public.recipes
for insert to authenticated with check (
  source_type = 'user' and created_by = (select auth.uid()) and visibility in ('public', 'private')
);
create policy "Users can update their own recipes" on public.recipes
for update to authenticated using (source_type = 'user' and created_by = (select auth.uid()))
with check (source_type = 'user' and created_by = (select auth.uid()) and visibility in ('public', 'private'));
create policy "Users can delete their own recipes" on public.recipes
for delete to authenticated using (source_type = 'user' and created_by = (select auth.uid()));

create policy "Users can read cuisines for visible recipes" on public.recipe_cuisines
for select to authenticated using (
  exists (select 1 from public.recipes where recipes.id = recipe_cuisines.recipe_id)
);
create policy "Users can manage cuisines for their recipes" on public.recipe_cuisines
for all to authenticated using (
  exists (select 1 from public.recipes where recipes.id = recipe_cuisines.recipe_id and recipes.created_by = (select auth.uid()) and recipes.source_type = 'user')
)
with check (
  exists (select 1 from public.recipes where recipes.id = recipe_cuisines.recipe_id and recipes.created_by = (select auth.uid()) and recipes.source_type = 'user')
);
create policy "Users can read ingredients for visible recipes" on public.recipe_ingredients
for select to authenticated using (
  exists (select 1 from public.recipes where recipes.id = recipe_ingredients.recipe_id)
);
create policy "Users can manage ingredients for their recipes" on public.recipe_ingredients
for all to authenticated using (
  exists (select 1 from public.recipes where recipes.id = recipe_ingredients.recipe_id and recipes.created_by = (select auth.uid()) and recipes.source_type = 'user')
)
with check (
  exists (select 1 from public.recipes where recipes.id = recipe_ingredients.recipe_id and recipes.created_by = (select auth.uid()) and recipes.source_type = 'user')
);
create policy "Users can read recipe household access they participate in" on public.recipe_household_access
for select to authenticated using (
  public.is_household_member(household_id)
  or exists (select 1 from public.recipes where recipes.id = recipe_household_access.recipe_id and recipes.created_by = (select auth.uid()))
);
create policy "Recipe authors can manage household recipe access" on public.recipe_household_access
for all to authenticated using (
  exists (select 1 from public.recipes where recipes.id = recipe_household_access.recipe_id and recipes.created_by = (select auth.uid()) and recipes.source_type = 'user')
)
with check (
  exists (select 1 from public.recipes where recipes.id = recipe_household_access.recipe_id and recipes.created_by = (select auth.uid()) and recipes.source_type = 'user')
  and public.is_household_member(household_id)
);

create policy "Household members can read weekly plans" on public.weekly_meal_plans
for select to authenticated using (public.is_household_member(household_id));
create policy "Household members can create weekly plans" on public.weekly_meal_plans
for insert to authenticated with check (public.is_household_member(household_id));
create policy "Household members can update weekly plans" on public.weekly_meal_plans
for update to authenticated using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));
create policy "Household members can delete weekly plans" on public.weekly_meal_plans
for delete to authenticated using (public.is_household_member(household_id));
create policy "Household members can read weekly plan items" on public.weekly_meal_plan_items
for select to authenticated using (public.is_household_member(household_id));
create policy "Household members can create weekly plan items" on public.weekly_meal_plan_items
for insert to authenticated with check (public.is_household_member(household_id));
create policy "Household members can update weekly plan items" on public.weekly_meal_plan_items
for update to authenticated using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));
create policy "Household members can delete weekly plan items" on public.weekly_meal_plan_items
for delete to authenticated using (public.is_household_member(household_id));

grant select on public.cuisines, public.cuisine_regions, public.ingredients, public.meal_categories, public.meal_slot_types to authenticated;
grant select, insert, update, delete on public.recipes, public.recipe_cuisines, public.recipe_ingredients, public.recipe_household_access to authenticated;
grant select, insert, update, delete on public.weekly_meal_plans, public.weekly_meal_plan_items to authenticated;
grant execute on function public.is_household_member(uuid) to authenticated;

insert into public.cuisines (slug, name, description) values
  ('indian', 'Indian', 'Indian cuisine'),
  ('italian', 'Italian', 'Italian cuisine'),
  ('chinese', 'Chinese', 'Chinese cuisine'),
  ('thai', 'Thai', 'Thai cuisine'),
  ('japanese', 'Japanese', 'Japanese cuisine'),
  ('mediterranean', 'Mediterranean', 'Mediterranean cuisine'),
  ('mexican', 'Mexican', 'Mexican cuisine');

insert into public.cuisine_regions (cuisine_id, slug, name, region_type, country_code, display_order)
select id, 'north-indian', 'North Indian', 'macro_region', 'IN', 1 from public.cuisines where slug = 'indian';
insert into public.cuisine_regions (cuisine_id, parent_id, slug, name, region_type, country_code, display_order)
select cuisine_id, id, 'punjab', 'Punjab', 'state', 'IN', 1 from public.cuisine_regions where slug = 'north-indian';
insert into public.cuisine_regions (cuisine_id, parent_id, slug, name, region_type, country_code, display_order)
select cuisine_id, id, 'rajasthan', 'Rajasthan', 'state', 'IN', 2 from public.cuisine_regions where slug = 'north-indian';
insert into public.cuisine_regions (cuisine_id, slug, name, region_type, country_code, display_order)
select id, 'south-indian', 'South Indian', 'macro_region', 'IN', 2 from public.cuisines where slug = 'indian';
insert into public.cuisine_regions (cuisine_id, parent_id, slug, name, region_type, country_code, display_order)
select cuisine_id, id, 'karnataka', 'Karnataka', 'state', 'IN', 1 from public.cuisine_regions where slug = 'south-indian';
insert into public.cuisine_regions (cuisine_id, parent_id, slug, name, region_type, country_code, display_order)
select cuisine_id, id, 'kerala', 'Kerala', 'state', 'IN', 2 from public.cuisine_regions where slug = 'south-indian';
insert into public.cuisine_regions (cuisine_id, parent_id, slug, name, region_type, country_code, display_order)
select cuisine_id, id, 'tamil-nadu', 'Tamil Nadu', 'state', 'IN', 3 from public.cuisine_regions where slug = 'south-indian';
insert into public.cuisine_regions (cuisine_id, parent_id, slug, name, region_type, country_code, display_order)
select cuisine_id, id, 'andhra-pradesh', 'Andhra Pradesh', 'state', 'IN', 4 from public.cuisine_regions where slug = 'south-indian';
insert into public.cuisine_regions (cuisine_id, parent_id, slug, name, region_type, country_code, display_order)
select cuisine_id, id, 'telangana', 'Telangana', 'state', 'IN', 5 from public.cuisine_regions where slug = 'south-indian';
insert into public.cuisine_regions (cuisine_id, slug, name, region_type, country_code, display_order)
select id, 'gujarat', 'Gujarat', 'state', 'IN', 3 from public.cuisines where slug = 'indian';
insert into public.cuisine_regions (cuisine_id, slug, name, region_type, country_code, display_order)
select id, 'maharashtra', 'Maharashtra', 'state', 'IN', 4 from public.cuisines where slug = 'indian';
insert into public.cuisine_regions (cuisine_id, slug, name, region_type, country_code, display_order)
select id, 'bengal', 'Bengal', 'state', 'IN', 5 from public.cuisines where slug = 'indian';

insert into public.meal_categories (slug, name, display_order) values
  ('breakfast', 'Breakfast', 1),
  ('lunch', 'Lunch', 2),
  ('dinner', 'Dinner', 3),
  ('snacks', 'Snacks', 4),
  ('drinks', 'Drinks', 5),
  ('desserts', 'Desserts', 6);

insert into public.meal_slot_types (slug, name, requires_recipe, display_order) values
  ('recipe', 'Recipe', true, 1),
  ('outside_food', 'Outside Food', false, 2),
  ('leftovers', 'Leftovers', false, 3),
  ('office_meal', 'Office Meal', false, 4),
  ('no_cooking', 'No Cooking', false, 5);
