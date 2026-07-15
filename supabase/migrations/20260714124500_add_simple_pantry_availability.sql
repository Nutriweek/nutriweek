alter table public.pantry_items
add column if not exists available boolean not null default true;

update public.pantry_items
set available = true
where available is null;

with ranked as (
  select
    id,
    row_number() over (
      partition by household_id, ingredient_id
      order by available desc, updated_at desc, created_at desc
    ) as row_number
  from public.pantry_items
)
delete from public.pantry_items
using ranked
where pantry_items.id = ranked.id
  and ranked.row_number > 1;

create unique index if not exists pantry_items_household_ingredient_unique
on public.pantry_items (household_id, ingredient_id);
