"use server";

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { ORDER_PROCESSING_FEE_CURRENCY, ORDER_PROCESSING_FEE_PAISE } from "./constants";
import { createRazorpayProcessingFeeOrder, fetchRazorpayPayment, verifyRazorpayPaymentSignature } from "./razorpay";

type ActionResult<T> = { success: true } & T | { success: false; message: string };
type StoreAssignmentRpcClient = {
  rpc: (functionName: string, parameters: Record<string, string>) => {
    single: () => Promise<{ data: { success?: boolean; message?: string } | null; error: unknown }>;
  };
};

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in.");
  return user;
}

/** Creates the existing checkout session's local-store fulfillment record and reserves one ₹100 payment attempt. */
export async function startLocalStoreProcessingFeePayment(checkoutSessionId: string, customerAddressId: string): Promise<ActionResult<{ localStoreOrderId: string; razorpayOrderId: string; amountPaise: number; currency: "INR" }>> {
  if (!checkoutSessionId || !customerAddressId) return { success: false, message: "A checkout session and delivery address are required." };
  try {
    const user = await getAuthenticatedUser();
    const admin = createAdminClient();
    const { data: orderId, error: orderError } = await admin.rpc("create_local_store_order", {
      p_checkout_session_id: checkoutSessionId,
      p_customer_address_id: customerAddressId,
      p_customer_user_id: user.id,
    });
    if (orderError || typeof orderId !== "string") throw new Error("Unable to prepare the local-store order.");

    const { data: reservation, error: reservationError } = await admin.rpc("reserve_order_payment", { p_order_id: orderId, p_customer_user_id: user.id }).single();
    const paymentReservation = reservation as { payment_id?: string; razorpay_order_id?: string | null; should_create?: boolean } | null;
    if (reservationError || !paymentReservation || typeof paymentReservation.payment_id !== "string") throw new Error("Unable to reserve the processing-fee payment.");
    if (typeof paymentReservation.razorpay_order_id === "string") {
      return { success: true, localStoreOrderId: orderId, razorpayOrderId: paymentReservation.razorpay_order_id, amountPaise: ORDER_PROCESSING_FEE_PAISE, currency: ORDER_PROCESSING_FEE_CURRENCY };
    }
    if (!paymentReservation.should_create) return { success: false, message: "Payment initialization is already in progress. Please try again shortly." };

    try {
      const razorpayOrder = await createRazorpayProcessingFeeOrder(orderId);
      const { error: attachError } = await admin.rpc("attach_razorpay_order_to_payment", { p_payment_id: paymentReservation.payment_id, p_razorpay_order_id: razorpayOrder.id });
      if (attachError) throw new Error("Unable to save the Razorpay order.");
      return { success: true, localStoreOrderId: orderId, razorpayOrderId: razorpayOrder.id, amountPaise: ORDER_PROCESSING_FEE_PAISE, currency: ORDER_PROCESSING_FEE_CURRENCY };
    } catch (error) {
      await admin.rpc("fail_reserved_order_payment", { p_payment_id: paymentReservation.payment_id });
      throw error;
    }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Unable to start payment." };
  }
}

/** Verifies browser-returned checkout fields and confirms captured payment through Razorpay's API. */
export async function verifyLocalStoreProcessingFeePayment(input: { localStoreOrderId: string; razorpayPaymentId: string; razorpayOrderId: string; razorpaySignature: string }): Promise<ActionResult<Record<never, never>>> {
  if (!input.localStoreOrderId || !input.razorpayPaymentId || !input.razorpayOrderId || !input.razorpaySignature) return { success: false, message: "Incomplete payment verification details." };
  try {
    const user = await getAuthenticatedUser();
    const admin = createAdminClient();
    const { data: order, error: orderError } = await admin.from("local_store_orders").select("customer_user_id").eq("id", input.localStoreOrderId).maybeSingle();
    if (orderError || !order || order.customer_user_id !== user.id) throw new Error("Order is not available to this customer.");
    const { data: payment, error: paymentError } = await admin.from("order_payments").select("razorpay_order_id, amount_paise, currency").eq("local_store_order_id", input.localStoreOrderId).eq("razorpay_order_id", input.razorpayOrderId).eq("status", "pending").maybeSingle();
    if (paymentError || !payment || payment.razorpay_order_id !== input.razorpayOrderId || payment.amount_paise !== ORDER_PROCESSING_FEE_PAISE || payment.currency !== ORDER_PROCESSING_FEE_CURRENCY) throw new Error("Payment attempt is not available.");
    if (!verifyRazorpayPaymentSignature(payment.razorpay_order_id, input.razorpayPaymentId, input.razorpaySignature)) throw new Error("Payment signature verification failed.");
    const razorpayPayment = await fetchRazorpayPayment(input.razorpayPaymentId);
    if (razorpayPayment.order_id !== payment.razorpay_order_id || razorpayPayment.amount !== ORDER_PROCESSING_FEE_PAISE || razorpayPayment.currency !== ORDER_PROCESSING_FEE_CURRENCY || razorpayPayment.status !== "captured") throw new Error("Payment has not been captured.");
    const { error: applyError } = await admin.rpc("apply_razorpay_payment_state", {
      p_razorpay_order_id: payment.razorpay_order_id,
      p_razorpay_payment_id: razorpayPayment.id,
      p_status: "paid",
      p_signature_verified: true,
    });
    if (applyError) throw new Error("Unable to confirm payment.");
    return { success: true };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Unable to verify payment." };
  }
}

/** Atomic first-store-wins assignment. The database RPC enforces membership, eligibility, and locking. */
export async function acceptLocalStoreOrder(orderId: string): Promise<ActionResult<Record<never, never>>> {
  if (!orderId) return { success: false, message: "An order is required." };
  const supabase = await createClient();
  const { data, error } = await (supabase as unknown as StoreAssignmentRpcClient).rpc("accept_local_store_order", { p_order_id: orderId }).single();
  if (error || !data) return { success: false, message: "Unable to accept this order." };
  return data.success ? { success: true } : { success: false, message: data.message ?? "This order is no longer available." };
}
