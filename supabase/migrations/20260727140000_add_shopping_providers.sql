create table public.shopping_providers (
  id text primary key,
  name text not null,
  provider_type text not null,
  status text not null,
  sort_order integer not null,
  icon text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shopping_providers_status_valid check (status in ('active', 'coming_soon')),
  constraint shopping_providers_sort_order_positive check (sort_order > 0)
);

insert into public.shopping_providers (id, name, provider_type, status, sort_order) values
  ('local_store', 'Local Store', 'local_store', 'active', 1),
  ('blinkit', 'Blinkit', 'quick_commerce', 'coming_soon', 2),
  ('zepto', 'Zepto', 'quick_commerce', 'coming_soon', 3),
  ('swiggy_instamart', 'Swiggy Instamart', 'quick_commerce', 'coming_soon', 4),
  ('bigbasket', 'BigBasket', 'online_grocery', 'coming_soon', 5);

alter table public.households
  add column preferred_shopping_provider_id text not null default 'local_store'
  references public.shopping_providers (id);

create index households_preferred_shopping_provider_idx on public.households (preferred_shopping_provider_id);

create trigger shopping_providers_set_updated_at
before update on public.shopping_providers
for each row execute function public.set_updated_at();

alter table public.shopping_providers enable row level security;

create policy "Authenticated users can read shopping providers" on public.shopping_providers
  for select to authenticated
  using (true);

grant select on public.shopping_providers to authenticated;

create function public.set_household_shopping_provider(
  target_household_id uuid,
  target_provider_id text
)
returns table(success boolean, message text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return query select false, 'Please sign in to update your shopping provider.';
    return;
  end if;

  if not exists (
    select 1 from public.household_members
    where household_id = target_household_id and user_id = auth.uid()
  ) then
    return query select false, 'Your household is not available.';
    return;
  end if;

  if not exists (
    select 1 from public.shopping_providers
    where id = target_provider_id and status = 'active'
  ) then
    return query select false, 'That shopping provider is not available yet.';
    return;
  end if;

  update public.households
  set preferred_shopping_provider_id = target_provider_id
  where id = target_household_id;

  return query select true, 'Shopping provider updated.';
end;
$$;

revoke execute on function public.set_household_shopping_provider(uuid, text) from public, anon;
grant execute on function public.set_household_shopping_provider(uuid, text) to authenticated;
