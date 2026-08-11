import "server-only";

import { parseBasketSnapshot, type BasketSnapshotItem } from "@/lib/grocery/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type StoreMembershipRow = { store_id: string };
type StoreRow = { id: string; name: string; network_status: string; operating_status: string };
type OfferRow = {
  local_store_order_id: string;
  store_id: string;
  status: "open" | "accepted";
  offered_at: string;
  expires_at: string;
  accepted_at: string | null;
};
type OrderRow = {
  id: string;
  checkout_session_id: string;
  status: string;
  assigned_store_id: string | null;
  assigned_at: string | null;
  delivery_address_snapshot: unknown;
};
type CheckoutSessionRow = { id: string; basket_snapshot: unknown; selected_grocery_item_ids: string[] };
type AddressSnapshot = {
  recipient_name?: string;
  phone?: string;
  line1?: string;
  line2?: string | null;
  landmark?: string | null;
  city?: string;
  state_province?: string;
  postal_code?: string;
};

export type StoreOrderItem = Pick<BasketSnapshotItem, "id" | "name" | "quantity" | "manualAdjustmentQuantity" | "baseUnit">;
export type StoreOrderInboxItem = {
  id: string;
  storeName: string;
  offerExpiresAt: string;
  acceptedAt: string | null;
  assignedAt: string | null;
  fulfillmentStatus: string;
  items: StoreOrderItem[];
  deliveryAddress: { recipientName: string; phone: string; summary: string } | null;
};

function addressForAssignedStore(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const address = value as AddressSnapshot;
  if (typeof address.recipient_name !== "string" || typeof address.phone !== "string" || typeof address.line1 !== "string") return null;
  const summary = [address.line1, address.line2, address.landmark, address.city, address.state_province, address.postal_code].filter((part): part is string => typeof part === "string" && part.length > 0).join(", ");
  return { recipientName: address.recipient_name, phone: address.phone, summary };
}

/**
 * Shapes store data on the server after checking the signed-in user's active store memberships.
 * Open offers intentionally omit customer address/location data; it becomes available only to the assigned store.
 */
export async function getStoreOrderInbox(): Promise<{ hasStoreAccess: boolean; availableOrders: StoreOrderInboxItem[]; assignedOrders: StoreOrderInboxItem[] }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in to view store orders.");

  const admin = createAdminClient();
  const { data: membershipData, error: membershipError } = await admin.from("store_members").select("store_id").eq("user_id", user.id).eq("is_active", true);
  if (membershipError) throw new Error("Unable to load store access.");
  const storeIds = (membershipData as StoreMembershipRow[] | null ?? []).map((membership) => membership.store_id);
  if (storeIds.length === 0) return { hasStoreAccess: false, availableOrders: [], assignedOrders: [] };

  const [{ data: storeData, error: storeError }, { data: offerData, error: offerError }] = await Promise.all([
    admin.from("stores").select("id, name, network_status, operating_status").in("id", storeIds),
    admin.from("local_store_order_offers").select("local_store_order_id, store_id, status, offered_at, expires_at, accepted_at").in("store_id", storeIds).in("status", ["open", "accepted"]).order("offered_at", { ascending: false }),
  ]);
  if (storeError || offerError) throw new Error("Unable to load store orders.");
  const offers = (offerData as OfferRow[] | null ?? []);
  if (offers.length === 0) return { hasStoreAccess: true, availableOrders: [], assignedOrders: [] };

  const orderIds = [...new Set(offers.map((offer) => offer.local_store_order_id))];
  const { data: orderData, error: orderError } = await admin.from("local_store_orders").select("id, checkout_session_id, status, assigned_store_id, assigned_at, delivery_address_snapshot").in("id", orderIds);
  if (orderError) throw new Error("Unable to load store order details.");
  const orders = (orderData as OrderRow[] | null ?? []);
  const orderById = new Map(orders.map((order) => [order.id, order]));

  const sessionIds = [...new Set(orders.map((order) => order.checkout_session_id))];
  const { data: sessionData, error: sessionError } = await admin.from("checkout_sessions").select("id, basket_snapshot, selected_grocery_item_ids").in("id", sessionIds);
  if (sessionError) throw new Error("Unable to load grocery items.");
  const sessions = new Map(((sessionData as CheckoutSessionRow[] | null ?? []).map((session) => [session.id, session])));
  const stores = new Map(((storeData as StoreRow[] | null ?? []).map((store) => [store.id, store])));

  const inboxItems = offers.flatMap((offer) => {
    const order = orderById.get(offer.local_store_order_id);
    const session = order ? sessions.get(order.checkout_session_id) : undefined;
    if (!order || !session) return [];
    const store = stores.get(offer.store_id);
    const assignedToThisStore = offer.status === "accepted" && order.assigned_store_id === offer.store_id;
    const availableToThisStore = offer.status === "open" && order.status === "offers_open" && order.assigned_store_id === null && offer.expires_at > new Date().toISOString() && store?.network_status === "active" && store.operating_status === "open";
    if (!assignedToThisStore && !availableToThisStore) return [];
    const selectedIds = new Set(session.selected_grocery_item_ids);
    const items = parseBasketSnapshot(session.basket_snapshot)
      .filter((item) => selectedIds.has(item.id))
      .map(({ id, name, quantity, manualAdjustmentQuantity, baseUnit }) => ({ id, name, quantity, manualAdjustmentQuantity, baseUnit }));
    return [{
      id: order.id,
      storeName: store?.name ?? "Local Store",
      offerExpiresAt: offer.expires_at,
      acceptedAt: offer.accepted_at,
      assignedAt: order.assigned_at,
      fulfillmentStatus: order.status,
      items,
      deliveryAddress: assignedToThisStore ? addressForAssignedStore(order.delivery_address_snapshot) : null,
      assignedToThisStore,
    }];
  });

  return {
    hasStoreAccess: true,
    availableOrders: inboxItems.filter((order) => !order.assignedToThisStore),
    assignedOrders: inboxItems.filter((order) => order.assignedToThisStore),
  };
}
