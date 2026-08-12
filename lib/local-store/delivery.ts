"use server";

import { createHmac, randomInt } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type DeliveryConfirmationResult = { success: true; checkoutSessionId: string } | { success: false; message: string };

function hashOtp(otp: string) {
  const secret = process.env.DELIVERY_OTP_SECRET;
  if (!secret) throw new Error("DELIVERY_OTP_SECRET is required for delivery confirmation.");
  return createHmac("sha256", secret).update(otp).digest("hex");
}

/** Internal-only delivery operation. Send the returned OTP through a future notification channel. */
export async function createDeliveryConfirmationOtp(localStoreOrderId: string) {
  const otp = randomInt(100_000, 1_000_000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const admin = createAdminClient();
  const { error } = await admin.rpc("create_delivery_confirmation", {
    p_order_id: localStoreOrderId,
    p_otp_hash: hashOtp(otp),
    p_expires_at: expiresAt,
  });
  if (error) throw new Error("Unable to create delivery confirmation.");
  return { otp, expiresAt };
}

/** Customer-facing server action foundation; it is not wired to UI in Stage 1. */
export async function confirmLocalStoreDelivery(localStoreOrderId: string, otp: string): Promise<DeliveryConfirmationResult> {
  if (!/^\d{6}$/.test(otp)) return { success: false, message: "Enter the six-digit delivery code." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Please sign in." };
  const admin = createAdminClient();
  const { data: order, error: orderError } = await admin.from("local_store_orders").select("checkout_session_id, customer_user_id").eq("id", localStoreOrderId).maybeSingle();
  if (orderError || !order || order.customer_user_id !== user.id) return { success: false, message: "This order is not available." };
  const { data: verified, error: verificationError } = await admin.rpc("verify_delivery_confirmation", {
    p_order_id: localStoreOrderId,
    p_customer_user_id: user.id,
    p_otp_hash: hashOtp(otp),
  });
  if (verificationError || !verified) return { success: false, message: "That delivery code is invalid or has expired." };
  const { error: finalizeError } = await admin.rpc("finalize_local_store_order", { p_order_id: localStoreOrderId });
  if (finalizeError) return { success: false, message: "Receipt was confirmed, but purchase finalization needs support." };
  return { success: true, checkoutSessionId: order.checkout_session_id as string };
}
