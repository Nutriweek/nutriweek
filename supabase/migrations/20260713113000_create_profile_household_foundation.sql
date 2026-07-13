create type public.gender as enum (
  'female',
  'male',
  'non_binary',
  'other',
  'prefer_not_to_say'
);

create type public.activity_level as enum (
  'sedentary',
  'lightly_active',
  'moderately_active',
  'very_active'
);

create type public.health_goal as enum (
  'lose_weight',
  'maintain_weight',
  'gain_muscle'
);

create type public.household_member_role as enum ('owner', 'member');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  date_of_birth date,
  gender public.gender,
  height_cm numeric(5, 2),
  weight_kg numeric(5, 2),
  activity_level public.activity_level,
  health_goal public.health_goal,
  diet_type text,
  allergies text[] not null default '{}',
  cuisine_preferences text[] not null default '{}',
  meals_per_day smallint,
  family_size smallint,
  weekly_grocery_budget numeric(10, 2),
  currency_code char(3),
  country text,
  state_province text,
  city text,
  kitchen_equipment text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_height_cm_positive check (height_cm is null or height_cm > 0),
  constraint profiles_weight_kg_positive check (weight_kg is null or weight_kg > 0),
  constraint profiles_meals_per_day_positive check (meals_per_day is null or meals_per_day > 0),
  constraint profiles_family_size_positive check (family_size is null or family_size > 0),
  constraint profiles_weekly_grocery_budget_non_negative check (
    weekly_grocery_budget is null or weekly_grocery_budget >= 0
  ),
  constraint profiles_budget_currency_pair check (
    (weekly_grocery_budget is null) = (currency_code is null)
  )
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.household_member_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create index households_created_by_idx on public.households (created_by);
create index household_members_user_id_idx on public.household_members (user_id);
create index household_members_household_id_idx on public.household_members (household_id);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger households_set_updated_at
before update on public.households
for each row execute function public.set_updated_at();

create trigger household_members_set_updated_at
before update on public.household_members
for each row execute function public.set_updated_at();

create function public.create_initial_profile_and_household(
  p_user_id uuid,
  p_user_full_name text default null
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  personal_household_id uuid;
  household_name text;
begin
  insert into public.profiles (id, full_name)
  values (p_user_id, nullif(btrim(p_user_full_name), ''))
  on conflict (id) do nothing;

  select households.id
  into personal_household_id
  from public.households
  where households.created_by = p_user_id
  order by households.created_at asc
  limit 1;

  if personal_household_id is null then
    household_name := case
      when nullif(btrim(p_user_full_name), '') is not null
        then nullif(btrim(p_user_full_name), '') || '''s Household'
      else 'My Household'
    end;

    insert into public.households (name, created_by)
    values (household_name, p_user_id)
    returning id into personal_household_id;
  end if;

  insert into public.household_members (household_id, user_id, role)
  values (personal_household_id, p_user_id, 'owner')
  on conflict (household_id, user_id) do nothing;
end;
$$;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.create_initial_profile_and_household(
    new.id,
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

select public.create_initial_profile_and_household(
  id,
  raw_user_meta_data ->> 'full_name'
)
from auth.users;

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;

create policy "Users can read their own profile"
on public.profiles
for select to authenticated
using ((select auth.uid()) = id);

create policy "Users can update their own profile"
on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Users can read households they belong to"
on public.households
for select to authenticated
using (
  exists (
    select 1
    from public.household_members
    where household_members.household_id = households.id
      and household_members.user_id = (select auth.uid())
  )
);

create policy "Users can read their own household memberships"
on public.household_members
for select to authenticated
using ((select auth.uid()) = user_id);

grant select, update on public.profiles to authenticated;
grant select on public.households to authenticated;
grant select on public.household_members to authenticated;

revoke execute on function public.create_initial_profile_and_household(uuid, text) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
