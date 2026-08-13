"use client";

import { CheckCircle2, Clock3, LoaderCircle, Store, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import CustomerDeliveryOtp from "@/components/grocery/CustomerDeliveryOtp";
import { getCustomerLocalStoreOrderStatusForPolling } from "@/lib/local-store/delivery";
import type { CustomerLocalStoreOrderStatus } from "@/lib/local-store/queries";

function statusCopy(order: CustomerLocalStoreOrderStatus) {
  const storeName = order.assignedStoreName ?? "A nearby local store";
  if (order.refundStatus === "processed" || order.paymentStatus === "refunded") return { icon: CheckCircle2, title: "₹100 refunded", detail: "Your processing-fee refund has been processed." };
  if (order.refundStatus === "pending") return { icon: Clock3, title: "Refund pending", detail: "Your ₹100 processing-fee refund is being processed." };
  if (order.paymentStatus === "failed") return { icon: TriangleAlert, title: "Payment failed", detail: "Your grocery basket is unchanged. Return to review order to retry the ₹100 processing-fee payment." };
  if (order.paymentStatus === "pending" || order.fulfillmentStatus === "awaiting_payment") return { icon: Clock3, title: "Payment pending", detail: "Complete the ₹100 processing-fee payment to send this order to nearby local stores." };
  if (order.fulfillmentStatus === "offers_open") return { icon: LoaderCircle, title: "Finding a nearby local store…", detail: "We're searching for a local store to accept your order. Please wait while we find a store for you.", searching: true };
  if (order.fulfillmentStatus === "assigned") return { icon: CheckCircle2, title: "Store accepted your order", detail: `${storeName} has accepted your order. Your groceries are now being prepared.` };
  if (order.fulfillmentStatus === "preparing") return { icon: Store, title: "Preparing your groceries", detail: `${storeName} is preparing your order. The grocery amount is paid directly to the store on delivery.` };
  if (order.fulfillmentStatus === "out_for_delivery") return { icon: Store, title: "Order is out for delivery", detail: `${storeName} is delivering your order. Pay the grocery amount directly to the store on delivery.` };
  if (order.fulfillmentStatus === "delivered") return { icon: CheckCircle2, title: "Delivery confirmed", detail: "Your delivery code was verified at handoff and your completed grocery order has been finalized." };
  if (order.fulfillmentStatus === "customer_confirmed") return { icon: CheckCircle2, title: "Delivery confirmed", detail: "Your receipt has been confirmed." };
  if (order.fulfillmentStatus === "failed") return { icon: TriangleAlert, title: "Store fulfillment failed", detail: "We will update you about the ₹100 processing-fee refund." };
  return { icon: TriangleAlert, title: "Order cancelled", detail: "This order is no longer being processed." };
}

export default function CustomerOrderTracking({ initialOrder }: { initialOrder: CustomerLocalStoreOrderStatus }) {
  const router = useRouter();
  const [order, setOrder] = useState(initialOrder);
  const previousStatus = useRef(initialOrder.fulfillmentStatus);

  useEffect(() => {
    const terminal = ["delivered", "customer_confirmed", "failed", "cancelled"].includes(order.fulfillmentStatus) || Boolean(order.purchaseFinalizedAt);
    if (terminal) return;
    let cancelled = false;
    const refresh = async () => {
      try {
        const next = await getCustomerLocalStoreOrderStatusForPolling(order.id);
        if (cancelled) return;
        const accepted = previousStatus.current === "offers_open" && ["assigned", "preparing", "out_for_delivery"].includes(next.fulfillmentStatus);
        previousStatus.current = next.fulfillmentStatus;
        setOrder(next);
        if (accepted) router.replace(`/dashboard/grocery/order-processing?order=${encodeURIComponent(next.id)}`);
        if (["delivered", "customer_confirmed"].includes(next.fulfillmentStatus) || next.purchaseFinalizedAt) router.refresh();
      } catch {
        // Preserve the already-authorized display on transient polling failures.
      }
    };
    const timer = window.setInterval(refresh, 2500);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [order.fulfillmentStatus, order.id, order.purchaseFinalizedAt, router]);

  const copy = statusCopy(order);
  const Icon = copy.icon;
  return <section className="mx-auto max-w-3xl space-y-6" aria-labelledby="order-processing-heading"><div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/[0.08] p-6 text-center backdrop-blur-xl sm:p-10"><Icon className={`mx-auto h-12 w-12 text-emerald-300 ${copy.searching ? "animate-spin" : ""}`} aria-hidden="true" /><p className="mt-5 text-sm font-medium uppercase tracking-widest text-emerald-300/80">Local Store order</p><h1 id="order-processing-heading" className="mt-2 text-3xl font-semibold tracking-tight text-white">{copy.title}</h1><p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-zinc-300">{copy.detail}</p>{copy.searching ? <div className="mx-auto mt-6 flex w-fit items-center gap-1.5 text-sm text-emerald-200"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" /><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300 [animation-delay:150ms]" /><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300 [animation-delay:300ms]" /><span className="ml-2">Please wait…</span></div> : null}<p className="mt-5 text-xs text-zinc-500">Order reference: {order.id}</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Link href="/dashboard/grocery" className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-zinc-200 transition hover:bg-white/10">Return to Grocery List</Link>{order.fulfillmentStatus === "delivered" && order.purchaseFinalizedAt ? <Link href={`/dashboard/grocery/order-confirmation?session=${encodeURIComponent(order.checkoutSessionId)}`} className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300">View completed order</Link> : null}</div></div>{order.fulfillmentStatus === "out_for_delivery" ? <CustomerDeliveryOtp orderId={order.id} /> : null}</section>;
}
