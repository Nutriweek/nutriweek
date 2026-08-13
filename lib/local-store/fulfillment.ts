"use server";

import "server-only";

import { hashDeliveryOtp } from "./otp";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type FulfillmentAction = "start_preparing" | "start_delivery";
type FulfillmentResult = { success: true } | { success: false; message: string };
type OrderRow = { assigned_store_id: string | null; status: string };

const transitions: Record<FulfillmentAction, { from: string; to: string; timestamp: string }> = {
  start_preparing: { from: "assigned", to: "preparing", timestamp: "preparing_at" },
  start_delivery: { from: "preparing", to: "out_for_delivery", timestamp: "out_for_delivery_at" },
};

async function getAssignedStoreOrder(orderId: string, allowedStatuses: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in.");

  const admin = createAdminClient();
  const { data: orderData, error: orderError } = await admin.from("local_store_orders").select("assigned_store_id, status").eq("id", orderId).maybeSingle();
  const order = orderData as OrderRow | null;
  if (orderError || !order || !order.assigned_store_id || !allowedStatuses.includes(order.status)) throw new Error("This order is not available for that fulfillment step.");

  const { data: membership, error: membershipError } = await admin.from("store_members").select("store_id").eq("store_id", order.assigned_store_id).eq("user_id", user.id).eq("is_active", true).maybeSingle();
  if (membershipError || !membership) throw new Error("This order is not assigned to your active store.");
  return { admin, order };
}

/** Server-authorized fulfillment transitions. Browser input never determines the current or next order state. */
export async function advanceLocalStoreFulfillment(orderId: string, action: FulfillmentAction): Promise<FulfillmentResult> {
  if (!orderId || !["start_preparing", "start_delivery"].includes(action)) return { success: false, message: "A valid fulfillment action is required." };
  try {
    const transition = transitions[action];
    const { admin, order } = await getAssignedStoreOrder(orderId, [transition.from]);
    const { data: updatedOrder, error: updateError } = await admin.from("local_store_orders").update({ status: transition.to, [transition.timestamp]: new Date().toISOString() }).eq("id", orderId).eq("assigned_store_id", order.assigned_store_id).eq("status", transition.from).select("id").maybeSingle();
    if (updateError || !updatedOrder) throw new Error("This order is no longer available for that fulfillment step.");

    return { success: true };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Unable to update this order." };
  }
}

/** Assigned store members can submit—but never generate or read—the customer-supplied delivery code. */
export async function verifyAssignedStoreDeliveryOtp(orderId: string, otp: string): Promise<FulfillmentResult> {
  if (!orderId || !/^\d{6}$/.test(otp)) return { success: false, message: "Enter the six-digit delivery code supplied by the customer." };
  const supabase = await createClient();
  const { data, error } = await (supabase as unknown as { rpc: (name: string, params: Record<string, string>) => PromiseLike<{ data: boolean | null; error: unknown }> }).rpc("verify_local_store_delivery_confirmation", { p_order_id: orderId, p_otp_hash: hashDeliveryOtp(otp) });
  if (error || !data) return { success: false, message: "That delivery code is invalid, expired, or this order is no longer available." };
  return { success: true };
}
