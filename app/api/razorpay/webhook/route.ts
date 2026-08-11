import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { verifyRazorpayWebhookSignature } from "@/lib/local-store/razorpay";

export const runtime = "nodejs";

function readText(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readPayment(payload: Record<string, unknown>) {
  const payment = payload.payment;
  if (!payment || typeof payment !== "object") return null;
  const entity = (payment as Record<string, unknown>).entity;
  if (!entity || typeof entity !== "object") return null;
  const record = entity as Record<string, unknown>;
  const id = readText(record.id);
  const orderId = readText(record.order_id);
  return id && orderId ? { id, orderId } : null;
}

function readRefund(payload: Record<string, unknown>) {
  const refund = payload.refund;
  if (!refund || typeof refund !== "object") return null;
  const entity = (refund as Record<string, unknown>).entity;
  if (!entity || typeof entity !== "object") return null;
  const record = entity as Record<string, unknown>;
  const id = readText(record.id);
  return id ? { id } : null;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  const eventId = request.headers.get("x-razorpay-event-id");
  if (!signature || !eventId || !verifyRazorpayWebhookSignature(rawBody, signature)) return new NextResponse("Invalid webhook signature.", { status: 400 });

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new NextResponse("Invalid webhook payload.", { status: 400 });
  }
  if (!payload || typeof payload !== "object" || typeof (payload as Record<string, unknown>).event !== "string") return new NextResponse("Invalid webhook payload.", { status: 400 });

  const event = (payload as Record<string, unknown>).event;
  const admin = createAdminClient();
  const { data: inserted, error: insertError } = await admin
    .from("razorpay_webhook_events")
    .insert({ razorpay_event_id: eventId, event_type: event, signature, raw_body: rawBody, payload })
    .select("id")
    .maybeSingle();
  if (insertError?.code === "23505") return NextResponse.json({ received: true, duplicate: true });
  if (insertError || !inserted) return new NextResponse("Unable to record webhook.", { status: 500 });

  try {
    const objectPayload = payload as Record<string, unknown>;
    const payment = readPayment(objectPayload);
    const refund = readRefund(objectPayload);
    if ((event === "payment.captured" || event === "order.paid") && payment) {
      const { error } = await admin.rpc("apply_razorpay_payment_state", {
        p_razorpay_order_id: payment.orderId,
        p_razorpay_payment_id: payment.id,
        p_status: "paid",
        p_signature_verified: false,
      });
      if (error) throw error;
    } else if (event === "payment.failed" && payment) {
      const { error } = await admin.rpc("apply_razorpay_payment_state", {
        p_razorpay_order_id: payment.orderId,
        p_razorpay_payment_id: payment.id,
        p_status: "failed",
        p_signature_verified: false,
      });
      if (error) throw error;
    } else if ((event === "refund.processed" || event === "refund.failed") && refund) {
      const { error } = await admin.rpc("apply_razorpay_refund_state", {
        p_razorpay_refund_id: refund.id,
        p_status: event === "refund.processed" ? "processed" : "failed",
      });
      if (error) throw error;
    }
    await admin.from("razorpay_webhook_events").update({ processing_status: payment || refund ? "processed" : "ignored", processed_at: new Date().toISOString() }).eq("id", inserted.id);
    return NextResponse.json({ received: true });
  } catch (error) {
    await admin.from("razorpay_webhook_events").update({ processing_status: "failed", processing_error: error instanceof Error ? error.message : "Webhook processing failed." }).eq("id", inserted.id);
    return new NextResponse("Webhook processing failed.", { status: 500 });
  }
}
