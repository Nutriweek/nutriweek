"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Clock3, MapPin, PackageCheck, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";

import { acceptLocalStoreOrder } from "@/lib/local-store/actions";
import { advanceLocalStoreFulfillment, verifyAssignedStoreDeliveryOtp } from "@/lib/local-store/fulfillment";
import type { StoreOrderInboxItem } from "@/lib/local-store/storeOrders";
import { displayShoppingQuantity, roundShoppingQuantity } from "@/lib/grocery/roundShoppingQuantity";

type StoreOrderInboxProps = { availableOrders: StoreOrderInboxItem[]; assignedOrders: StoreOrderInboxItem[] };

function OrderItems({ items }: { items: StoreOrderInboxItem["items"] }) {
  return <ul className="mt-4 divide-y divide-white/[0.08] rounded-2xl border border-white/[0.08] px-4">{items.map((item) => {
    const quantity = item.manualAdjustmentQuantity === 0 ? roundShoppingQuantity(item.quantity, item.baseUnit) : displayShoppingQuantity(item.quantity, item.baseUnit);
    return <li key={item.id} className="flex items-center justify-between gap-4 py-3 text-sm"><span className="font-medium text-white">{item.name}</span><span className="shrink-0 text-emerald-300">{quantity.quantity} {quantity.unit}</span></li>;
  })}</ul>;
}

export default function StoreOrderInbox({ availableOrders, assignedOrders }: StoreOrderInboxProps) {
  const router = useRouter();
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [deliveryOtp, setDeliveryOtp] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  function acceptOrder(orderId: string) {
    if (isPending || pendingOrderId) return;
    setPendingOrderId(orderId);
    setFeedback(null);
    startTransition(async () => {
      const result = await acceptLocalStoreOrder(orderId);
      setPendingOrderId(null);
      if (!result.success) {
        setFeedback({ kind: "error", message: result.message });
        router.refresh();
        return;
      }
      setFeedback({ kind: "success", message: "Order accepted. The delivery details are now available below." });
      router.refresh();
    });
  }

  function advanceOrder(orderId: string, action: "start_preparing" | "start_delivery") {
    if (isPending || pendingOrderId) return;
    setPendingOrderId(orderId);
    setFeedback(null);
    startTransition(async () => {
      const result = await advanceLocalStoreFulfillment(orderId, action);
      setPendingOrderId(null);
      if (!result.success) {
        setFeedback({ kind: "error", message: result.message });
        router.refresh();
        return;
      }
      setFeedback({ kind: "success", message: "Order fulfillment status updated." });
      router.refresh();
    });
  }

  function verifyDelivery(orderId: string) {
    const otp = deliveryOtp[orderId] ?? "";
    if (isPending || pendingOrderId) return;
    setPendingOrderId(orderId);
    setFeedback(null);
    startTransition(async () => {
      const result = await verifyAssignedStoreDeliveryOtp(orderId, otp);
      setPendingOrderId(null);
      setFeedback(result.success ? { kind: "success", message: "Delivery code verified. The completed order has been finalized." } : { kind: "error", message: result.message });
      router.refresh();
    });
  }

  function fulfillmentButton(order: StoreOrderInboxItem) {
    const pending = pendingOrderId === order.id;
    if (order.fulfillmentStatus === "assigned") return <button type="button" onClick={() => advanceOrder(order.id, "start_preparing")} disabled={isPending} className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60">{pending ? "Updating…" : "Start preparing"}</button>;
    if (order.fulfillmentStatus === "preparing") return <button type="button" onClick={() => advanceOrder(order.id, "start_delivery")} disabled={isPending} className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60">{pending ? "Updating…" : "Send out for delivery"}</button>;
    if (order.fulfillmentStatus === "out_for_delivery") return <div className="mt-4 space-y-3"><label className="block text-sm font-medium text-zinc-200" htmlFor={`delivery-otp-${order.id}`}>Enter delivery OTP</label><input id={`delivery-otp-${order.id}`} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={deliveryOtp[order.id] ?? ""} onChange={(event) => setDeliveryOtp((current) => ({ ...current, [order.id]: event.target.value.replace(/\D/g, "") }))} className="h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-center text-lg tracking-[0.25em] text-white outline-none focus:border-emerald-300" placeholder="000000" /><button type="button" onClick={() => verifyDelivery(order.id)} disabled={isPending || (deliveryOtp[order.id] ?? "").length !== 6} className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60">{pending ? "Verifying…" : "Verify delivery OTP"}</button></div>;
    return null;
  }

  return <div className="space-y-6">
    {feedback ? <div role="status" className={`flex gap-3 rounded-2xl border p-4 text-sm ${feedback.kind === "success" ? "border-emerald-400/20 bg-emerald-500/[0.08] text-emerald-100" : "border-amber-300/20 bg-amber-300/[0.08] text-amber-100"}`}>{feedback.kind === "success" ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden="true" /> : <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" aria-hidden="true" />}{feedback.message}</div> : null}
    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-7" aria-labelledby="available-orders-heading">
      <div className="flex items-center gap-3"><Clock3 className="h-5 w-5 text-emerald-300" aria-hidden="true" /><div><h2 id="available-orders-heading" className="text-lg font-semibold text-white">Available orders</h2><p className="mt-1 text-sm text-zinc-400">Accepting an order is final. The first eligible store to accept receives it.</p></div></div>
      {availableOrders.length === 0 ? <p className="mt-5 rounded-2xl border border-dashed border-white/10 p-4 text-sm text-zinc-400">There are no orders available for your store right now.</p> : <div className="mt-5 space-y-4">{availableOrders.map((order) => <article key={`${order.id}-${order.storeName}`} className="rounded-2xl border border-white/[0.08] bg-black/10 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-medium text-emerald-300">{order.storeName}</p><h3 className="mt-1 text-base font-semibold text-white">Grocery order</h3><p className="mt-1 text-xs text-zinc-500">Available until {new Date(order.offerExpiresAt).toLocaleString()}</p></div><button type="button" onClick={() => acceptOrder(order.id)} disabled={isPending} className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60">{pendingOrderId === order.id ? "Accepting…" : "Accept order"}</button></div><OrderItems items={order.items} /><p className="mt-4 text-xs text-zinc-500">Delivery address and customer contact details are shown only after the order is accepted.</p></article>)}</div>}
    </section>
    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-7" aria-labelledby="assigned-orders-heading">
      <div className="flex items-center gap-3"><PackageCheck className="h-5 w-5 text-emerald-300" aria-hidden="true" /><div><h2 id="assigned-orders-heading" className="text-lg font-semibold text-white">Assigned to your store</h2><p className="mt-1 text-sm text-zinc-400">Customer delivery details are available only for orders assigned to this store.</p></div></div>
      {assignedOrders.length === 0 ? <p className="mt-5 rounded-2xl border border-dashed border-white/10 p-4 text-sm text-zinc-400">No orders have been assigned to your store yet.</p> : <div className="mt-5 space-y-4">{assignedOrders.map((order) => <article key={`${order.id}-${order.storeName}`} className="rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.05] p-5"><p className="text-sm font-medium text-emerald-300">{order.storeName}</p><h3 className="mt-1 text-base font-semibold text-white">{order.fulfillmentStatus.replaceAll("_", " ")}</h3><p className="mt-1 text-xs text-zinc-500">Accepted {order.acceptedAt ? new Date(order.acceptedAt).toLocaleString() : "just now"}</p><OrderItems items={order.items} />{order.deliveryAddress ? <div className="mt-4 flex gap-3 rounded-xl border border-white/[0.08] bg-black/10 p-4 text-sm text-zinc-300"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden="true" /><div><p className="font-medium text-white">{order.deliveryAddress.recipientName}</p><p className="mt-1">{order.deliveryAddress.phone}</p><p className="mt-1">{order.deliveryAddress.summary}</p></div></div> : <p className="mt-4 flex gap-2 text-sm text-amber-200"><TriangleAlert className="h-5 w-5 shrink-0" aria-hidden="true" />Delivery details are unavailable. Please contact Nutriweek support.</p>}{fulfillmentButton(order)}</article>)}</div>}
    </section>
  </div>;
}
