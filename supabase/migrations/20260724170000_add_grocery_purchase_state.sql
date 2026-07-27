alter table public.grocery_list_items
  add column if not exists is_purchased boolean not null default false;
