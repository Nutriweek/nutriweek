alter table public.checkout_sessions
  add column status text not null default 'selecting_store',
  add constraint checkout_sessions_status_valid check (status in ('selecting_store', 'placed'));
