-- v0.21.0 Stage 1: local-store marketplace and payment foundation.
-- Checkout sessions remain the single cart/checkout source of truth.

create extension if not exists postgis with schema extensions;

create table public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  label text not null default 'Home',
  recipient_name text not null,
  phone text not null,
  line1 text not null,
  line2 text,
  landmark text,
  city text not null,
  state_province text not null,
  postal_code text not null,
  country_code char(2) not null default 'IN',
  location extensions.geography(Point, 4326) not null,
  is_active boolean not null default true,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_addresses_country_code_valid check (country_code ~ '^[A-Z]{2}$')
);

create unique index customer_addresses_one_default_per_user_idx
  on public.customer_addresses (user_id) where is_default and is_active;
create index customer_addresses_household_idx on public.customer_addresses (household_id);
create index customer_addresses_location_idx on public.customer_addresses using gist (location);

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  contact_phone text not null,
  contact_email text,
  line1 text not null,
  line2 text,
  landmark text,
  city text not null,
  state_province text not null,
  postal_code text not null,
  country_code char(2) not null default 'IN',
  location extensions.geography(Point, 4326) not null,
  network_status text not null default 'active',
  operating_status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stores_network_status_valid check (network_status in ('active', 'inactive', 'suspended')),
  constraint stores_operating_status_valid check (operating_status in ('open', 'closed', 'paused')),
  constraint stores_country_code_valid check (country_code ~ '^[A-Z]{2}$')
);

create index stores_eligible_location_idx on public.stores using gist (location)
  where network_status = 'active' and operating_status = 'open';

create table public.store_members (
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'staff',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (store_id, user_id),
  constraint store_members_role_valid check (role in ('owner', 'manager', 'staff'))
);

create index store_members_active_user_idx on public.store_members (user_id, store_id) where is_active;

create table public.local_store_orders (
  id uuid primary key default gen_random_uuid(),
  checkout_session_id uuid not null unique references public.checkout_sessions(id) on delete restrict,
  customer_user_id uuid not null references auth.users(id) on delete restrict,
  household_id uuid not null references public.households(id) on delete restrict,
  customer_address_id uuid references public.customer_addresses(id) on delete set null,
  delivery_address_snapshot jsonb not null,
  delivery_location extensions.geography(Point, 4326) not null,
  status text not null default 'awaiting_payment',
  assigned_store_id uuid references public.stores(id) on delete restrict,
  offered_at timestamptz,
  assigned_at timestamptz,
  preparing_at timestamptz,
  out_for_delivery_at timestamptz,
  delivered_at timestamptz,
  customer_confirmed_at timestamptz,
  failed_at timestamptz,
  cancelled_at timestamptz,
  failure_reason text,
  issue_reason text,
  refund_reason text,
  purchase_finalized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint local_store_orders_status_valid check (status in ('awaiting_payment', 'offers_open', 'assigned', 'preparing', 'out_for_delivery', 'delivered', 'customer_confirmed', 'failed', 'cancelled')),
  constraint local_store_orders_assignment_valid check ((assigned_store_id is null) = (assigned_at is null))
);

create index local_store_orders_customer_idx on public.local_store_orders (customer_user_id, created_at desc);
create index local_store_orders_open_offers_idx on public.local_store_orders using gist (delivery_location) where status = 'offers_open';
create index local_store_orders_assigned_store_idx on public.local_store_orders (assigned_store_id, status) where assigned_store_id is not null;

create table public.local_store_order_offers (
  id uuid primary key default gen_random_uuid(),
  local_store_order_id uuid not null references public.local_store_orders(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  status text not null default 'open',
  offered_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  withdrawn_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (local_store_order_id, store_id),
  constraint local_store_order_offers_status_valid check (status in ('open', 'accepted', 'withdrawn', 'expired')),
  constraint local_store_order_offers_acceptance_valid check ((accepted_at is null) or status = 'accepted')
);

create index local_store_order_offers_store_open_idx on public.local_store_order_offers (store_id, offered_at desc) where status = 'open';

create table public.order_payments (
  id uuid primary key default gen_random_uuid(),
  local_store_order_id uuid not null references public.local_store_orders(id) on delete restrict,
  razorpay_order_id text unique,
  razorpay_payment_id text unique,
  amount_paise integer not null default 10000,
  currency char(3) not null default 'INR',
  status text not null default 'pending',
  signature_verified_at timestamptz,
  paid_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint order_payments_amount_fixed check (amount_paise = 10000),
  constraint order_payments_currency_fixed check (currency = 'INR'),
  constraint order_payments_status_valid check (status in ('pending', 'paid', 'failed', 'refunded'))
);

create unique index order_payments_one_pending_per_order_idx on public.order_payments (local_store_order_id) where status = 'pending';
create index order_payments_order_idx on public.order_payments (local_store_order_id, created_at desc);

create table public.razorpay_webhook_events (
  id uuid primary key default gen_random_uuid(),
  razorpay_event_id text not null unique,
  event_type text not null,
  signature text not null,
  raw_body text not null,
  payload jsonb not null,
  processing_status text not null default 'received',
  processed_at timestamptz,
  processing_error text,
  created_at timestamptz not null default now(),
  constraint razorpay_webhook_events_status_valid check (processing_status in ('received', 'processed', 'ignored', 'failed'))
);

create table public.order_refunds (
  id uuid primary key default gen_random_uuid(),
  local_store_order_id uuid not null references public.local_store_orders(id) on delete restrict,
  order_payment_id uuid not null references public.order_payments(id) on delete restrict,
  razorpay_refund_id text unique,
  amount_paise integer not null default 10000,
  reason text not null,
  status text not null default 'pending',
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint order_refunds_amount_fixed check (amount_paise = 10000),
  constraint order_refunds_status_valid check (status in ('pending', 'processed', 'failed'))
);

create index order_refunds_order_idx on public.order_refunds (local_store_order_id, created_at desc);
create unique index order_refunds_one_per_payment_idx on public.order_refunds (order_payment_id);

create table public.delivery_confirmations (
  local_store_order_id uuid primary key references public.local_store_orders(id) on delete cascade,
  otp_hash text not null,
  expires_at timestamptz not null,
  attempts smallint not null default 0,
  issue_state text not null default 'none',
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint delivery_confirmations_attempts_valid check (attempts >= 0 and attempts <= 10),
  constraint delivery_confirmations_issue_state_valid check (issue_state in ('none', 'reported', 'resolved'))
);

create function public.create_local_store_order(
  p_checkout_session_id uuid,
  p_customer_address_id uuid,
  p_customer_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_household_id uuid;
  v_existing_order_id uuid;
  v_address public.customer_addresses%rowtype;
  v_order_id uuid;
begin
  select household_id into v_household_id
  from public.checkout_sessions
  where id = p_checkout_session_id
    and selected_shopping_provider_id = 'local_store'
    and status in ('selecting_store', 'placed');

  if v_household_id is null or not exists (
    select 1 from public.household_members
    where household_id = v_household_id and user_id = p_customer_user_id
  ) then
    raise exception 'Checkout session is not available to this customer.';
  end if;

  select * into v_address
  from public.customer_addresses
  where id = p_customer_address_id
    and user_id = p_customer_user_id
    and household_id = v_household_id
    and is_active;
  if not found then raise exception 'Delivery address is not available to this customer.'; end if;

  select id into v_existing_order_id from public.local_store_orders where checkout_session_id = p_checkout_session_id;
  if v_existing_order_id is not null then return v_existing_order_id; end if;

  insert into public.local_store_orders (
    checkout_session_id, customer_user_id, household_id, customer_address_id,
    delivery_address_snapshot, delivery_location
  ) values (
    p_checkout_session_id, p_customer_user_id, v_household_id, v_address.id,
    jsonb_build_object('label', v_address.label, 'recipient_name', v_address.recipient_name, 'phone', v_address.phone,
      'line1', v_address.line1, 'line2', v_address.line2, 'landmark', v_address.landmark,
      'city', v_address.city, 'state_province', v_address.state_province, 'postal_code', v_address.postal_code,
      'country_code', v_address.country_code),
    v_address.location
  ) returning id into v_order_id;
  return v_order_id;
end;
$$;

create function public.accept_local_store_order(p_order_id uuid)
returns table(success boolean, message text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_order public.local_store_orders%rowtype;
  v_store_id uuid;
begin
  if auth.uid() is null then return query select false, 'Please sign in.'; return; end if;

  select o.* into v_order from public.local_store_orders o where o.id = p_order_id for update;
  if not found or v_order.status <> 'offers_open' or v_order.assigned_store_id is not null then
    return query select false, 'This order is no longer available.'; return;
  end if;

  select offer.store_id into v_store_id
  from public.local_store_order_offers offer
  join public.store_members member on member.store_id = offer.store_id
  join public.stores store on store.id = offer.store_id
  where offer.local_store_order_id = p_order_id
    and member.user_id = auth.uid() and member.is_active
    and store.network_status = 'active' and store.operating_status = 'open'
    and offer.status = 'open' and offer.expires_at > now()
    and extensions.ST_DWithin(store.location, v_order.delivery_location, 5000)
  for update of offer;
  if v_store_id is null then
    return query select false, 'Your store cannot accept this order.'; return;
  end if;

  update public.local_store_orders
  set assigned_store_id = v_store_id, assigned_at = now(), status = 'assigned'
  where id = p_order_id and status = 'offers_open' and assigned_store_id is null;
  if not found then
    return query select false, 'This order was accepted by another store.'; return;
  end if;

  update public.local_store_order_offers
  set status = case when store_id = v_store_id then 'accepted' else 'withdrawn' end,
      accepted_at = case when store_id = v_store_id then now() else accepted_at end,
      withdrawn_at = case when store_id <> v_store_id then now() else withdrawn_at end
  where local_store_order_id = p_order_id and status = 'open';

  return query select true, 'Order accepted.';
end;
$$;

create function public.apply_razorpay_payment_state(
  p_razorpay_order_id text,
  p_razorpay_payment_id text,
  p_status text,
  p_signature_verified boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_payment public.order_payments%rowtype;
  v_order public.local_store_orders%rowtype;
begin
  if p_status not in ('paid', 'failed') then raise exception 'Invalid payment state.'; end if;
  select * into v_payment from public.order_payments where razorpay_order_id = p_razorpay_order_id for update;
  if not found then raise exception 'Unknown Razorpay order.'; end if;
  if v_payment.amount_paise <> 10000 or v_payment.currency <> 'INR' then raise exception 'Invalid processing fee.'; end if;

  select * into v_order from public.local_store_orders where id = v_payment.local_store_order_id for update;
  if p_status = 'failed' then
    if v_payment.status = 'pending' then
      update public.order_payments set status = 'failed', failed_at = now(), razorpay_payment_id = coalesce(p_razorpay_payment_id, razorpay_payment_id) where id = v_payment.id;
    end if;
    return v_order.id;
  end if;

  if v_payment.status = 'refunded' then raise exception 'A refunded payment cannot be reused.'; end if;
  update public.order_payments
  set status = 'paid', razorpay_payment_id = coalesce(p_razorpay_payment_id, razorpay_payment_id),
      signature_verified_at = case when p_signature_verified then coalesce(signature_verified_at, now()) else signature_verified_at end,
      paid_at = coalesce(paid_at, now())
  where id = v_payment.id;

  if v_order.status = 'awaiting_payment' then
    update public.local_store_orders set status = 'offers_open', offered_at = now() where id = v_order.id;
    insert into public.local_store_order_offers (local_store_order_id, store_id, expires_at)
    select v_order.id, store.id, now() + interval '10 minutes'
    from public.stores store
    where store.network_status = 'active' and store.operating_status = 'open'
      and extensions.ST_DWithin(store.location, v_order.delivery_location, 5000)
    on conflict (local_store_order_id, store_id) do nothing;
  end if;
  return v_order.id;
end;
$$;

create function public.reserve_order_payment(p_order_id uuid, p_customer_user_id uuid)
returns table(payment_id uuid, razorpay_order_id text, should_create boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.local_store_orders%rowtype;
  v_payment public.order_payments%rowtype;
begin
  select * into v_order from public.local_store_orders where id = p_order_id for update;
  if not found or v_order.customer_user_id <> p_customer_user_id or v_order.status <> 'awaiting_payment' then
    raise exception 'Order is not available for payment.';
  end if;
  select * into v_payment from public.order_payments
  where local_store_order_id = p_order_id and status = 'pending'
  order by created_at desc limit 1 for update;
  if found then
    return query select v_payment.id, v_payment.razorpay_order_id, false;
    return;
  end if;
  insert into public.order_payments (local_store_order_id) values (p_order_id) returning * into v_payment;
  return query select v_payment.id, null::text, true;
end;
$$;

create function public.attach_razorpay_order_to_payment(p_payment_id uuid, p_razorpay_order_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_razorpay_order_id is null or length(p_razorpay_order_id) = 0 then raise exception 'Razorpay order ID is required.'; end if;
  update public.order_payments set razorpay_order_id = p_razorpay_order_id
  where id = p_payment_id and status = 'pending' and razorpay_order_id is null;
  if not found then raise exception 'Payment attempt is no longer available.'; end if;
end;
$$;

create function public.fail_reserved_order_payment(p_payment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.order_payments set status = 'failed', failed_at = now()
  where id = p_payment_id and status = 'pending' and razorpay_order_id is null;
end;
$$;

create function public.create_order_refund_request(p_order_id uuid, p_reason text)
returns table(refund_id uuid, razorpay_payment_id text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.local_store_orders%rowtype;
  v_payment public.order_payments%rowtype;
  v_refund public.order_refunds%rowtype;
begin
  if nullif(btrim(p_reason), '') is null then raise exception 'Refund reason is required.'; end if;
  select * into v_order from public.local_store_orders where id = p_order_id for update;
  if not found or v_order.status <> 'failed' then raise exception 'This order is not eligible for a processing-fee refund.'; end if;
  select * into v_payment from public.order_payments where local_store_order_id = p_order_id and status = 'paid' order by paid_at desc limit 1 for update;
  if not found or v_payment.razorpay_payment_id is null then raise exception 'No captured payment is available to refund.'; end if;
  select * into v_refund from public.order_refunds where order_payment_id = v_payment.id for update;
  if found then return query select v_refund.id, v_payment.razorpay_payment_id; return; end if;
  insert into public.order_refunds (local_store_order_id, order_payment_id, reason)
  values (p_order_id, v_payment.id, btrim(p_reason)) returning * into v_refund;
  update public.local_store_orders set refund_reason = btrim(p_reason) where id = p_order_id;
  return query select v_refund.id, v_payment.razorpay_payment_id;
end;
$$;

create function public.apply_razorpay_refund_state(p_razorpay_refund_id text, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_refund public.order_refunds%rowtype;
begin
  if p_status not in ('processed', 'failed') then raise exception 'Invalid refund state.'; end if;
  select * into v_refund from public.order_refunds where razorpay_refund_id = p_razorpay_refund_id for update;
  if not found then return; end if;
  update public.order_refunds set status = p_status,
    processed_at = case when p_status = 'processed' then coalesce(processed_at, now()) else processed_at end,
    failed_at = case when p_status = 'failed' then coalesce(failed_at, now()) else failed_at end
  where id = v_refund.id;
  if p_status = 'processed' then update public.order_payments set status = 'refunded' where id = v_refund.order_payment_id and status = 'paid'; end if;
end;
$$;

create function public.finalize_local_store_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.local_store_orders%rowtype;
  v_session public.checkout_sessions%rowtype;
  v_grocery_list public.grocery_lists%rowtype;
begin
  select * into v_order from public.local_store_orders where id = p_order_id for update;
  if not found or v_order.status <> 'customer_confirmed' then raise exception 'Order is not ready for purchase finalization.'; end if;
  if v_order.purchase_finalized_at is not null then return; end if;
  select * into v_session from public.checkout_sessions where id = v_order.checkout_session_id for update;
  if v_session.status = 'completed' then
    update public.local_store_orders set purchase_finalized_at = now() where id = v_order.id;
    return;
  end if;

  if v_session.grocery_list_id is not null then
    select * into v_grocery_list from public.grocery_lists where id = v_session.grocery_list_id for update;
    with purchased_items as (
      delete from public.grocery_list_items item
      where item.grocery_list_id = v_session.grocery_list_id
        and item.id = any(v_session.selected_grocery_item_ids)
      returning item.ingredient_id, item.custom_name, item.effective_quantity_base, item.base_unit_code
    )
    insert into public.purchase_history (household_id, ingredient_id, ingredient_name, quantity, unit, purchased_at)
    select v_order.household_id, item.ingredient_id, coalesce(ingredient.name, item.custom_name, 'Grocery item'), item.effective_quantity_base, item.base_unit_code, now()
    from purchased_items item left join public.ingredients ingredient on ingredient.id = item.ingredient_id;
    update public.weekly_meal_plans set status = 'purchased'
    where id = v_grocery_list.weekly_meal_plan_id and household_id = v_order.household_id;
  end if;

  update public.checkout_sessions
  set status = 'completed', completed_at = now(),
      basket_snapshot = (
        select coalesce(jsonb_agg(case when item ->> 'id' = any(v_session.selected_grocery_item_ids::text[]) then jsonb_set(item, '{purchased}', 'true'::jsonb, true) else item end), '[]'::jsonb)
        from jsonb_array_elements(v_session.basket_snapshot) item
      )
  where id = v_session.id;
  update public.local_store_orders set purchase_finalized_at = now() where id = v_order.id;
end;
$$;

create function public.create_delivery_confirmation(p_order_id uuid, p_otp_hash text, p_expires_at timestamptz)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if nullif(p_otp_hash, '') is null or p_expires_at <= now() then raise exception 'A valid delivery confirmation is required.'; end if;
  if not exists (select 1 from public.local_store_orders where id = p_order_id and status = 'delivered') then raise exception 'Order is not ready for customer confirmation.'; end if;
  insert into public.delivery_confirmations (local_store_order_id, otp_hash, expires_at)
  values (p_order_id, p_otp_hash, p_expires_at)
  on conflict (local_store_order_id) do update set otp_hash = excluded.otp_hash, expires_at = excluded.expires_at, attempts = 0, verified_at = null, issue_state = 'none';
end;
$$;

create function public.verify_delivery_confirmation(p_order_id uuid, p_customer_user_id uuid, p_otp_hash text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.local_store_orders%rowtype;
  v_confirmation public.delivery_confirmations%rowtype;
begin
  select * into v_order from public.local_store_orders where id = p_order_id for update;
  if not found or v_order.customer_user_id <> p_customer_user_id or v_order.status <> 'delivered' then return false; end if;
  select * into v_confirmation from public.delivery_confirmations where local_store_order_id = p_order_id for update;
  if not found or v_confirmation.verified_at is not null or v_confirmation.expires_at <= now() or v_confirmation.attempts >= 10 then return false; end if;
  if v_confirmation.otp_hash <> p_otp_hash then
    update public.delivery_confirmations set attempts = attempts + 1 where local_store_order_id = p_order_id;
    return false;
  end if;
  update public.delivery_confirmations set verified_at = now() where local_store_order_id = p_order_id;
  update public.local_store_orders set status = 'customer_confirmed', customer_confirmed_at = now() where id = p_order_id;
  return true;
end;
$$;

create trigger customer_addresses_set_updated_at before update on public.customer_addresses for each row execute function public.set_updated_at();
create trigger stores_set_updated_at before update on public.stores for each row execute function public.set_updated_at();
create trigger store_members_set_updated_at before update on public.store_members for each row execute function public.set_updated_at();
create trigger local_store_orders_set_updated_at before update on public.local_store_orders for each row execute function public.set_updated_at();
create trigger local_store_order_offers_set_updated_at before update on public.local_store_order_offers for each row execute function public.set_updated_at();
create trigger order_payments_set_updated_at before update on public.order_payments for each row execute function public.set_updated_at();
create trigger order_refunds_set_updated_at before update on public.order_refunds for each row execute function public.set_updated_at();
create trigger delivery_confirmations_set_updated_at before update on public.delivery_confirmations for each row execute function public.set_updated_at();

alter table public.customer_addresses enable row level security;
alter table public.stores enable row level security;
alter table public.store_members enable row level security;
alter table public.local_store_orders enable row level security;
alter table public.local_store_order_offers enable row level security;
alter table public.order_payments enable row level security;
alter table public.razorpay_webhook_events enable row level security;
alter table public.order_refunds enable row level security;
alter table public.delivery_confirmations enable row level security;

create policy "Customers can manage their addresses" on public.customer_addresses for all to authenticated
  using (user_id = (select auth.uid()) and public.is_household_member(household_id))
  with check (user_id = (select auth.uid()) and public.is_household_member(household_id));
create policy "Customers can read their local store orders" on public.local_store_orders for select to authenticated using (customer_user_id = (select auth.uid()));
create policy "Customers can read their order payments" on public.order_payments for select to authenticated using (
  exists (select 1 from public.local_store_orders orders where orders.id = order_payments.local_store_order_id and orders.customer_user_id = (select auth.uid()))
);
create policy "Customers can read their refunds" on public.order_refunds for select to authenticated using (
  exists (select 1 from public.local_store_orders orders where orders.id = order_refunds.local_store_order_id and orders.customer_user_id = (select auth.uid()))
);
create policy "Store members can read their own offers" on public.local_store_order_offers for select to authenticated using (
  exists (select 1 from public.store_members members where members.store_id = local_store_order_offers.store_id and members.user_id = (select auth.uid()) and members.is_active)
);

revoke all on public.customer_addresses, public.stores, public.store_members, public.local_store_orders, public.local_store_order_offers, public.order_payments, public.razorpay_webhook_events, public.order_refunds, public.delivery_confirmations from anon, authenticated;
grant select, insert, update, delete on public.customer_addresses to authenticated;
grant select on public.local_store_orders, public.order_payments, public.order_refunds, public.local_store_order_offers to authenticated;
revoke execute on function public.create_local_store_order(uuid, uuid, uuid), public.apply_razorpay_payment_state(text, text, text, boolean), public.reserve_order_payment(uuid, uuid), public.attach_razorpay_order_to_payment(uuid, text), public.fail_reserved_order_payment(uuid), public.create_order_refund_request(uuid, text), public.apply_razorpay_refund_state(text, text), public.create_delivery_confirmation(uuid, text, timestamptz), public.verify_delivery_confirmation(uuid, uuid, text), public.finalize_local_store_order(uuid) from public, anon, authenticated;
revoke execute on function public.accept_local_store_order(uuid) from public, anon;
grant execute on function public.accept_local_store_order(uuid) to authenticated;
