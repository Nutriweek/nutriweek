"use server";

import { randomInt } from "node:crypto";

import { hashDeliveryOtp } from "./otp";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCustomerLocalStoreOrderStatus, type CustomerLocalStoreOrderStatus } from "./queries";

type CustomerDeliveryOtpResult = { success: true; state: "generated" | "existing" | "expired"; otp?: string; expiresAt: string | null } | { success: false; message: string };

/** Customer-authorized OTP generation. The raw code is returned only for an approved customer delivery channel. */
export async function createCustomerDeliveryOtp(localStoreOrderId: string): Promise<CustomerDeliveryOtpResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Please sign in." };
  const { data: order, error: orderError } = await supabase.from("local_store_orders").select("id, status").eq("id", localStoreOrderId).eq("customer_user_id", user.id).maybeSingle();
  if (orderError || !order) return { success: false, message: "This order is not available." };
  if (order.status !== "out_for_delivery") return { success: false, message: "A delivery code is available only while your order is out for delivery." };
  const admin = createAdminClient();
  const { data: confirmation, error: confirmationError } = await admin.from("delivery_confirmations").select("expires_at, verified_at").eq("local_store_order_id", localStoreOrderId).maybeSingle();
  if (confirmationError) return { success: false, message: confirmationError.message || "Unable to check your delivery code." };
  if (confirmation?.verified_at) return { success: false, message: "This delivery has already been confirmed." };
  if (confirmation?.expires_at && new Date(confirmation.expires_at).getTime() > Date.now()) return { success: true, state: "existing", expiresAt: confirmation.expires_at };
  if (confirmation?.expires_at) return { success: true, state: "expired", expiresAt: confirmation.expires_at };
  const otp = randomInt(100_000, 1_000_000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const { error } = await admin.rpc("create_customer_delivery_confirmation", {
    p_order_id: localStoreOrderId,
    p_customer_user_id: user.id,
    p_otp_hash: hashDeliveryOtp(otp),
    p_expires_at: expiresAt,
  });
  if (error) return { success: false, message: error.message || "Your delivery code is not available yet." };
  return { success: true, state: "generated", otp, expiresAt };
}

export async function replaceExpiredCustomerDeliveryOtp(localStoreOrderId: string): Promise<CustomerDeliveryOtpResult> {
  const current = await createCustomerDeliveryOtp(localStoreOrderId);
  if (!current.success || current.state !== "expired") return current;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Please sign in." };
  const otp = randomInt(100_000, 1_000_000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const { error } = await createAdminClient().rpc("create_customer_delivery_confirmation", {
    p_order_id: localStoreOrderId,
    p_customer_user_id: user.id,
    p_otp_hash: hashDeliveryOtp(otp),
    p_expires_at: expiresAt,
  });
  if (error) return { success: false, message: error.message || "Unable to generate a new delivery code." };
  return { success: true, state: "generated", otp, expiresAt };
}

export async function getCustomerLocalStoreOrderStatusForPolling(orderId: string): Promise<CustomerLocalStoreOrderStatus> {
  return getCustomerLocalStoreOrderStatus(orderId);
}
