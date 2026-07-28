alter table public.checkout_sessions
  add column basket_snapshot jsonb not null default '[]'::jsonb;
