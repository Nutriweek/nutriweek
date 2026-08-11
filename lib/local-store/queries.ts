import { createClient } from "@/lib/supabase/server";

export type CustomerLocalStoreOrderStatus = {
  id: string;
  fulfillmentStatus: string;
  paymentStatus: string | null;
  refundStatus: string | null;
  createdAt: string;
};

type QueryResult = { data: unknown; error: { message?: string } | null };
type MarketplaceQuery = PromiseLike<QueryResult> & {
  select: (columns: string) => MarketplaceQuery;
  eq: (column: string, value: unknown) => MarketplaceQuery;
  order: (column: string, options?: { ascending?: boolean }) => MarketplaceQuery;
  limit: (count: number) => MarketplaceQuery;
  maybeSingle: () => Promise<QueryResult>;
};

function table(supabase: unknown, tableName: string): MarketplaceQuery {
  return (supabase as { from: (table: string) => MarketplaceQuery }).from(tableName);
}

export async function getCustomerLocalStoreOrderStatus(orderId: string): Promise<CustomerLocalStoreOrderStatus> {
  if (!orderId) throw new Error("An order is required.");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in to view this order.");
  const { data: order, error: orderError } = await table(supabase, "local_store_orders").select("id, status, created_at").eq("id", orderId).eq("customer_user_id", user.id).maybeSingle();
  if (orderError || !order) throw new Error("This order is not available.");
  const orderRecord = order as { id: string; status: string; created_at: string };
  const { data: payment } = await table(supabase, "order_payments").select("status").eq("local_store_order_id", orderRecord.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const { data: refund } = await table(supabase, "order_refunds").select("status").eq("local_store_order_id", orderRecord.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  return {
    id: orderRecord.id,
    fulfillmentStatus: orderRecord.status,
    paymentStatus: payment ? (payment as { status: string }).status : null,
    refundStatus: refund ? (refund as { status: string }).status : null,
    createdAt: orderRecord.created_at,
  };
}
