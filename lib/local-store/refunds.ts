import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import { createRazorpayProcessingFeeRefund } from "./razorpay";

/**
 * Internal-only operation for a policy-approved failed fulfillment.
 * Callers must perform their own staff/support authorization before invoking it.
 */
export async function requestLocalStoreProcessingFeeRefund(localStoreOrderId: string, reason: string) {
  if (!localStoreOrderId || !reason.trim()) throw new Error("An order and refund reason are required.");
  const admin = createAdminClient();
  const { data: request, error: requestError } = await admin.rpc("create_order_refund_request", { p_order_id: localStoreOrderId, p_reason: reason.trim() }).single();
  const refundRequest = request as { refund_id?: string; razorpay_payment_id?: string } | null;
  if (requestError || !refundRequest || typeof refundRequest.refund_id !== "string" || typeof refundRequest.razorpay_payment_id !== "string") throw new Error("Unable to prepare the refund.");
  const refund = await createRazorpayProcessingFeeRefund(refundRequest.razorpay_payment_id, `nw-refund-${refundRequest.refund_id}`);
  const { error: updateError } = await admin.from("order_refunds").update({ razorpay_refund_id: refund.id }).eq("id", refundRequest.refund_id).is("razorpay_refund_id", null);
  if (updateError) throw new Error("Unable to save the Razorpay refund.");
  if (refund.status === "processed" || refund.status === "failed") {
    const { error: applyError } = await admin.rpc("apply_razorpay_refund_state", { p_razorpay_refund_id: refund.id, p_status: refund.status });
    if (applyError) throw new Error("Unable to record the refund state.");
  }
}
