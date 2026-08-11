import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { ORDER_PROCESSING_FEE_CURRENCY, ORDER_PROCESSING_FEE_PAISE } from "./constants";

type RazorpayOrder = { id: string; amount: number; currency: string; status: string };
type RazorpayPayment = { id: string; order_id: string; amount: number; currency: string; status: string };
type RazorpayRefund = { id: string; status: string; amount: number };

function getCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay server credentials are not configured.");
  return { keyId, keySecret };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function parseOrder(value: unknown): RazorpayOrder {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.amount !== "number" || typeof value.currency !== "string" || typeof value.status !== "string") throw new Error("Razorpay returned an invalid order response.");
  return { id: value.id, amount: value.amount, currency: value.currency, status: value.status };
}

function parsePayment(value: unknown): RazorpayPayment {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.order_id !== "string" || typeof value.amount !== "number" || typeof value.currency !== "string" || typeof value.status !== "string") throw new Error("Razorpay returned an invalid payment response.");
  return { id: value.id, order_id: value.order_id, amount: value.amount, currency: value.currency, status: value.status };
}

function parseRefund(value: unknown): RazorpayRefund {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.status !== "string" || typeof value.amount !== "number") throw new Error("Razorpay returned an invalid refund response.");
  return { id: value.id, status: value.status, amount: value.amount };
}

async function razorpayRequest(path: string, init: RequestInit): Promise<unknown> {
  const { keyId, keySecret } = getCredentials();
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error("Razorpay request failed.");
  return data;
}

export async function createRazorpayProcessingFeeOrder(localStoreOrderId: string) {
  const order = parseOrder(await razorpayRequest("/orders", {
    method: "POST",
    body: JSON.stringify({
      amount: ORDER_PROCESSING_FEE_PAISE,
      currency: ORDER_PROCESSING_FEE_CURRENCY,
      receipt: `nw-${localStoreOrderId}`,
      notes: { local_store_order_id: localStoreOrderId, purpose: "nutriweek_order_processing_fee" },
    }),
  }));
  if (order.amount !== ORDER_PROCESSING_FEE_PAISE || order.currency !== ORDER_PROCESSING_FEE_CURRENCY) throw new Error("Razorpay processing-fee order amount is invalid.");
  return order;
}

export async function fetchRazorpayPayment(paymentId: string) {
  return parsePayment(await razorpayRequest(`/payments/${encodeURIComponent(paymentId)}`, { method: "GET" }));
}

export async function createRazorpayProcessingFeeRefund(paymentId: string, receipt: string) {
  const refund = parseRefund(await razorpayRequest(`/payments/${encodeURIComponent(paymentId)}/refund`, {
    method: "POST",
    body: JSON.stringify({ amount: ORDER_PROCESSING_FEE_PAISE, receipt, notes: { purpose: "nutriweek_order_processing_fee_refund" } }),
  }));
  if (refund.amount !== ORDER_PROCESSING_FEE_PAISE) throw new Error("Razorpay refund amount is invalid.");
  return refund;
}

export function verifyRazorpayPaymentSignature(razorpayOrderId: string, razorpayPaymentId: string, signature: string) {
  const { keySecret } = getCredentials();
  const expected = createHmac("sha256", keySecret).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(signature, "utf8");
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function verifyRazorpayWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new Error("RAZORPAY_WEBHOOK_SECRET is required for webhook verification.");
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(signature, "utf8");
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}
