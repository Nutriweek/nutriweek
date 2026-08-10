-- Event lists reuse the existing checkout session and provider flow. A session
-- has exactly one source: a generated grocery list or an event grocery list.
alter table public.checkout_sessions
  alter column grocery_list_id drop not null,
  add column event_grocery_list_id uuid references public.event_grocery_lists(id) on delete cascade,
  add constraint checkout_sessions_exactly_one_source check (
    (grocery_list_id is not null and event_grocery_list_id is null)
    or (grocery_list_id is null and event_grocery_list_id is not null)
  );

create index checkout_sessions_event_grocery_list_idx on public.checkout_sessions (event_grocery_list_id)
where event_grocery_list_id is not null;
