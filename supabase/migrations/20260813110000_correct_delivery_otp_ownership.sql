-- Customer-owned delivery OTPs. Raw OTPs never enter the database.

create or replace function public.finalize_local_store_order(p_order_id uuid)
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
  if not found or v_order.status not in ('customer_confirmed', 'delivered') then raise exception 'Order is not ready for purchase finalization.'; end if;
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

create function public.create_customer_delivery_confirmation(
  p_order_id uuid,
  p_customer_user_id uuid,
  p_otp_hash text,
  p_expires_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.local_store_orders%rowtype;
begin
  if nullif(btrim(p_otp_hash), '') is null or p_expires_at <= now() then raise exception 'A valid delivery confirmation is required.'; end if;
  select * into v_order from public.local_store_orders where id = p_order_id for update;
  if not found or v_order.customer_user_id <> p_customer_user_id or v_order.status <> 'out_for_delivery' then raise exception 'Order is not available for a customer delivery code.'; end if;
  insert into public.delivery_confirmations (local_store_order_id, otp_hash, expires_at)
  values (p_order_id, p_otp_hash, p_expires_at)
  on conflict (local_store_order_id) do update set otp_hash = excluded.otp_hash, expires_at = excluded.expires_at, attempts = 0, verified_at = null, issue_state = 'none';
end;
$$;

create function public.verify_local_store_delivery_confirmation(p_order_id uuid, p_otp_hash text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.local_store_orders%rowtype;
  v_confirmation public.delivery_confirmations%rowtype;
begin
  if auth.uid() is null or nullif(btrim(p_otp_hash), '') is null then return false; end if;
  select * into v_order from public.local_store_orders where id = p_order_id for update;
  if not found or v_order.status <> 'out_for_delivery' or v_order.assigned_store_id is null then return false; end if;
  if not exists (
    select 1 from public.store_members member
    where member.store_id = v_order.assigned_store_id and member.user_id = auth.uid() and member.is_active
  ) then return false; end if;
  select * into v_confirmation from public.delivery_confirmations where local_store_order_id = p_order_id for update;
  if not found or v_confirmation.verified_at is not null or v_confirmation.expires_at <= now() or v_confirmation.attempts >= 10 then return false; end if;
  if v_confirmation.otp_hash <> p_otp_hash then
    update public.delivery_confirmations set attempts = attempts + 1 where local_store_order_id = p_order_id;
    return false;
  end if;
  update public.delivery_confirmations set verified_at = now() where local_store_order_id = p_order_id;
  update public.local_store_orders set status = 'delivered', delivered_at = now() where id = p_order_id and status = 'out_for_delivery';
  perform public.finalize_local_store_order(p_order_id);
  return true;
end;
$$;

revoke execute on function public.create_customer_delivery_confirmation(uuid, uuid, text, timestamptz), public.verify_local_store_delivery_confirmation(uuid, text) from public, anon, authenticated;
grant execute on function public.verify_local_store_delivery_confirmation(uuid, text) to authenticated;
