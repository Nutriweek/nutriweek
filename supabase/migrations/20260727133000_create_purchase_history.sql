create table public.purchase_history (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  ingredient_id uuid references public.ingredients (id) on delete restrict,
  ingredient_name text not null,
  quantity numeric(12, 3) not null,
  unit text not null,
  purchased_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint purchase_history_quantity_non_negative check (quantity >= 0)
);

create index purchase_history_household_purchased_idx on public.purchase_history (household_id, purchased_at desc);

alter table public.purchase_history enable row level security;

create policy "Household members can manage purchase history" on public.purchase_history
  for all to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

grant select, insert, update, delete on public.purchase_history to authenticated;

create function public.complete_grocery_purchase(item_ids uuid[])
returns void
language plpgsql
as $$
begin
  with purchased_items as (
    delete from public.grocery_list_items as grocery_item
    using public.grocery_lists as grocery_list
    where grocery_item.grocery_list_id = grocery_list.id
      and grocery_item.id = any(item_ids)
      and public.is_household_member(grocery_list.household_id)
    returning grocery_list.household_id, grocery_item.ingredient_id, grocery_item.custom_name, grocery_item.effective_quantity_base, grocery_item.base_unit_code
  )
  insert into public.purchase_history (household_id, ingredient_id, ingredient_name, quantity, unit, purchased_at)
  select
    purchased_item.household_id,
    purchased_item.ingredient_id,
    coalesce(ingredient.name, purchased_item.custom_name, 'Grocery item'),
    purchased_item.effective_quantity_base,
    purchased_item.base_unit_code,
    now()
  from purchased_items as purchased_item
  left join public.ingredients as ingredient on ingredient.id = purchased_item.ingredient_id;
end;
$$;

grant execute on function public.complete_grocery_purchase(uuid[]) to authenticated;
