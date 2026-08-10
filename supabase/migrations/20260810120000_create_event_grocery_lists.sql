-- EVENT-GROCERY-001: standalone, user-owned shopping lists for occasions.
create table public.event_grocery_catalog_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  display_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.event_grocery_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.event_grocery_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.event_grocery_lists(id) on delete cascade,
  catalog_item_id uuid not null references public.event_grocery_catalog_items(id),
  quantity numeric(12,3) not null check (quantity > 0),
  unit text not null check (unit in ('kg', 'g', 'litre', 'ml', 'packet', 'box', 'bottle', 'piece', 'dozen')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (list_id, catalog_item_id)
);

create index event_grocery_lists_user_updated_idx on public.event_grocery_lists (user_id, updated_at desc);
create index event_grocery_items_list_idx on public.event_grocery_items (list_id);

create trigger event_grocery_catalog_items_set_updated_at before update on public.event_grocery_catalog_items for each row execute function public.set_updated_at();
create trigger event_grocery_lists_set_updated_at before update on public.event_grocery_lists for each row execute function public.set_updated_at();
create trigger event_grocery_items_set_updated_at before update on public.event_grocery_items for each row execute function public.set_updated_at();

alter table public.event_grocery_catalog_items enable row level security;
alter table public.event_grocery_lists enable row level security;
alter table public.event_grocery_items enable row level security;

create policy "Authenticated users can read event grocery catalog" on public.event_grocery_catalog_items for select to authenticated using (is_active);
create policy "Users can manage their event grocery lists" on public.event_grocery_lists for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Users can manage items in their event grocery lists" on public.event_grocery_items for all to authenticated using (
  exists (select 1 from public.event_grocery_lists lists where lists.id = event_grocery_items.list_id and lists.user_id = (select auth.uid()))
) with check (
  exists (select 1 from public.event_grocery_lists lists where lists.id = event_grocery_items.list_id and lists.user_id = (select auth.uid()))
);

grant select on public.event_grocery_catalog_items to authenticated;
grant select, insert, update, delete on public.event_grocery_lists, public.event_grocery_items to authenticated;

insert into public.event_grocery_catalog_items (slug, name, display_order) values
  ('rice', 'Rice', 1), ('wheat-flour', 'Wheat Flour', 2), ('maida', 'Maida', 3), ('rava-sooji', 'Rava / Sooji', 4),
  ('toor-dal', 'Toor Dal', 5), ('moong-dal', 'Moong Dal', 6), ('chana-dal', 'Chana Dal', 7), ('urad-dal', 'Urad Dal', 8), ('rajma', 'Rajma', 9), ('chickpeas', 'Chickpeas', 10),
  ('sugar', 'Sugar', 11), ('jaggery', 'Jaggery', 12), ('salt', 'Salt', 13), ('cooking-oil', 'Cooking Oil', 14), ('ghee', 'Ghee', 15),
  ('mustard-seeds', 'Mustard Seeds', 16), ('cumin', 'Cumin', 17), ('turmeric', 'Turmeric', 18), ('red-chilli-powder', 'Red Chilli Powder', 19), ('garam-masala', 'Garam Masala', 20), ('coriander-powder', 'Coriander Powder', 21),
  ('onions', 'Onions', 22), ('tomatoes', 'Tomatoes', 23), ('potatoes', 'Potatoes', 24), ('green-chilli', 'Green Chilli', 25), ('ginger', 'Ginger', 26), ('garlic', 'Garlic', 27), ('coriander-leaves', 'Coriander Leaves', 28), ('curry-leaves', 'Curry Leaves', 29), ('lemon', 'Lemon', 30), ('coconut', 'Coconut', 31),
  ('curd', 'Curd', 32), ('milk', 'Milk', 33), ('paneer', 'Paneer', 34), ('vegetables', 'Vegetables', 35), ('fruits', 'Fruits', 36)
on conflict (slug) do update set name = excluded.name, display_order = excluded.display_order, is_active = true;
