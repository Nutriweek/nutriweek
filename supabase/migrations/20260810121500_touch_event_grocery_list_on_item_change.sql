create or replace function public.touch_event_grocery_list()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.event_grocery_lists
  set updated_at = now()
  where id = coalesce(new.list_id, old.list_id);
  return coalesce(new, old);
end;
$$;

create trigger event_grocery_items_touch_list
after insert or update or delete on public.event_grocery_items
for each row execute function public.touch_event_grocery_list();
