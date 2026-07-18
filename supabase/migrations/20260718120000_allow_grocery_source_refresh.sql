-- Grocery refreshes replace the complete source set for one grocery list.
-- Inserts were permitted, but RLS prevented the preceding delete, causing
-- retained source rows to conflict with the replacement insert.
create policy "Household members can delete grocery sources" on public.grocery_list_item_sources
for delete to authenticated
using (
  exists (
    select 1
    from public.grocery_list_items
    join public.grocery_lists on grocery_lists.id = grocery_list_items.grocery_list_id
    where grocery_list_items.id = grocery_list_item_sources.grocery_list_item_id
      and public.is_household_member(grocery_lists.household_id)
  )
);
