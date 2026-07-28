create table public.checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  grocery_list_id uuid not null references public.grocery_lists (id) on delete cascade,
  selected_grocery_item_ids uuid[] not null,
  selected_shopping_provider_id text references public.shopping_providers (id),
  created_at timestamptz not null default now(),
  constraint checkout_sessions_selected_items_not_empty check (cardinality(selected_grocery_item_ids) > 0)
);

create index checkout_sessions_household_created_idx on public.checkout_sessions (household_id, created_at desc);

alter table public.checkout_sessions enable row level security;

create policy "Household members can manage checkout sessions" on public.checkout_sessions
  for all to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

grant select, insert, update, delete on public.checkout_sessions to authenticated;
