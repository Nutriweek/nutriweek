import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type CustomerLocalStoreOrderStatus = {
  id: string;
  fulfillmentStatus: string;
  paymentStatus: string | null;
  refundStatus: string | null;
  checkoutSessionId: string;
  purchaseFinalizedAt: string | null;
  createdAt: string;
  assignedStoreName: string | null;
};

export type CustomerActiveLocalStoreOrder = Pick<CustomerLocalStoreOrderStatus, "id" | "fulfillmentStatus">;

type QueryResult = { data: unknown; error: { message?: string } | null };
type MarketplaceQuery = PromiseLike<QueryResult> & {
  select: (columns: string) => MarketplaceQuery;
  eq: (column: string, value: unknown) => MarketplaceQuery;
  in: (column: string, values: unknown[]) => MarketplaceQuery;
  order: (column: string, options?: { ascending?: boolean }) => MarketplaceQuery;
  limit: (count: number) => MarketplaceQuery;
  maybeSingle: () => Promise<QueryResult>;
};

function table(supabase: unknown, tableName: string): MarketplaceQuery {
  return (supabase as { from: (table: string) => MarketplaceQuery }).from(tableName);
}

export async function getCustomerActiveLocalStoreOrder(groceryListId: string): Promise<CustomerActiveLocalStoreOrder | null> {
  if (!groceryListId) return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in to view this order.");

  const { data: sessions, error: sessionsError } = await table(supabase, "checkout_sessions")
    .select("id")
    .eq("grocery_list_id", groceryListId);
  if (sessionsError) throw new Error("Unable to load your grocery order.");

  const sessionIds = ((sessions ?? []) as { id: string }[]).map((session) => session.id);
  if (sessionIds.length === 0) return null;

  const { data: orders, error: ordersError } = await table(supabase, "local_store_orders")
    .select("id, status, created_at, purchase_finalized_at")
    .eq("customer_user_id", user.id)
    .in("checkout_session_id", sessionIds)
    .order("created_at", { ascending: false });
  if (ordersError) throw new Error("Unable to load your grocery order.");

  const activeOrders = ((orders ?? []) as { id: string; status: string; purchase_finalized_at: string | null }[])
    .filter((candidate) => candidate.purchase_finalized_at === null && !["delivered", "customer_confirmed", "failed", "cancelled"].includes(candidate.status));
  const order = activeOrders.sort((left, right) => activeOrderPriority(right.status) - activeOrderPriority(left.status))[0];
  return order ? { id: order.id, fulfillmentStatus: order.status } : null;
}

function activeOrderPriority(status: string) {
  if (status === "out_for_delivery") return 4;
  if (status === "preparing") return 3;
  if (status === "assigned") return 2;
  if (status === "offers_open") return 1;
  return 0;
}

export async function getCustomerLocalStoreOrderStatus(orderId: string): Promise<CustomerLocalStoreOrderStatus> {
  if (!orderId) throw new Error("An order is required.");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in to view this order.");
  const { data: order, error: orderError } = await table(supabase, "local_store_orders").select("id, status, created_at, checkout_session_id, purchase_finalized_at, assigned_store_id").eq("id", orderId).eq("customer_user_id", user.id).maybeSingle();
  if (orderError || !order) throw new Error("This order is not available.");
  const orderRecord = order as { id: string; status: string; created_at: string; checkout_session_id: string; purchase_finalized_at: string | null; assigned_store_id: string | null };
  const { data: payment } = await table(supabase, "order_payments").select("status").eq("local_store_order_id", orderRecord.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const { data: refund } = await table(supabase, "order_refunds").select("status").eq("local_store_order_id", orderRecord.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const { data: assignedStore } = orderRecord.assigned_store_id
    ? await createAdminClient().from("stores").select("name").eq("id", orderRecord.assigned_store_id).maybeSingle()
    : { data: null };
  return {
    id: orderRecord.id,
    fulfillmentStatus: orderRecord.status,
    paymentStatus: payment ? (payment as { status: string }).status : null,
    refundStatus: refund ? (refund as { status: string }).status : null,
    checkoutSessionId: orderRecord.checkout_session_id,
    purchaseFinalizedAt: orderRecord.purchase_finalized_at,
    createdAt: orderRecord.created_at,
    assignedStoreName: assignedStore?.name ?? null,
  };
}
