import Link from "next/link";
import { CheckCircle2, Clock3, Store, TriangleAlert } from "lucide-react";

import { getCustomerLocalStoreOrderStatus } from "@/lib/local-store/queries";

type OrderProcessingPageProps = { searchParams: Promise<{ order?: string }> };

function statusCopy(order: Awaited<ReturnType<typeof getCustomerLocalStoreOrderStatus>>) {
  if (order.refundStatus === "processed" || order.paymentStatus === "refunded") return { icon: CheckCircle2, title: "₹100 refunded", detail: "Your processing-fee refund has been processed." };
  if (order.refundStatus === "pending") return { icon: Clock3, title: "Refund pending", detail: "Your ₹100 processing-fee refund is being processed." };
  if (order.paymentStatus === "failed") return { icon: TriangleAlert, title: "Payment failed", detail: "Your grocery basket is unchanged. Return to review order to retry the ₹100 processing-fee payment." };
  if (order.paymentStatus === "pending" || order.fulfillmentStatus === "awaiting_payment") return { icon: Clock3, title: "Payment pending", detail: "Complete the ₹100 processing-fee payment to send this order to nearby local stores." };
  if (order.fulfillmentStatus === "offers_open") return { icon: Clock3, title: "₹100 payment received", detail: "We’re finding a nearby local store to fulfill your order." };
  if (order.fulfillmentStatus === "assigned") return { icon: Store, title: "Store assigned", detail: "A nearby local store has accepted your order and will begin preparing it." };
  if (["preparing", "out_for_delivery", "delivered"].includes(order.fulfillmentStatus)) return { icon: Store, title: "Fulfillment in progress", detail: "Your local store is processing your order. The grocery amount is paid directly to the store on delivery." };
  if (order.fulfillmentStatus === "customer_confirmed") return { icon: CheckCircle2, title: "Delivery confirmed", detail: "Your receipt has been confirmed." };
  if (order.fulfillmentStatus === "failed") return { icon: TriangleAlert, title: "Store fulfillment failed", detail: "We will update you about the ₹100 processing-fee refund." };
  return { icon: TriangleAlert, title: "Order cancelled", detail: "This order is no longer being processed." };
}

export default async function OrderProcessingPage({ searchParams }: OrderProcessingPageProps) {
  const { order: orderId } = await searchParams;
  const order = await getCustomerLocalStoreOrderStatus(orderId ?? "");
  const copy = statusCopy(order);
  const Icon = copy.icon;
  return <section className="mx-auto max-w-3xl space-y-6" aria-labelledby="order-processing-heading"><div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/[0.08] p-6 text-center backdrop-blur-xl sm:p-10"><Icon className="mx-auto h-12 w-12 text-emerald-300" aria-hidden="true" /><p className="mt-5 text-sm font-medium uppercase tracking-widest text-emerald-300/80">Local Store order</p><h1 id="order-processing-heading" className="mt-2 text-3xl font-semibold tracking-tight text-white">{copy.title}</h1><p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-zinc-300">{copy.detail}</p><p className="mt-5 text-xs text-zinc-500">Order reference: {order.id}</p><div className="mt-8"><Link href="/dashboard/grocery" className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-zinc-200 transition hover:bg-white/10">Return to Grocery List</Link></div></div></section>;
}
