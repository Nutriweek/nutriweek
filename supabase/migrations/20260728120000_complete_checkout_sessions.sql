alter table public.checkout_sessions
  drop constraint checkout_sessions_status_valid,
  add column completed_at timestamptz,
  add constraint checkout_sessions_status_valid check (status in ('selecting_store', 'placed', 'completed'));
