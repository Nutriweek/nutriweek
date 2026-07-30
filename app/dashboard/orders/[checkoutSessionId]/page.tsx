import { ArrowLeft, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCheckoutOrderDetails } from "@/lib/grocery/checkoutSessions";
import { displayShoppingQuantity, roundShoppingQuantity } from "@/lib/grocery/roundShoppingQuantity";
import { formatWeekRange } from "@/lib/meal-plans";

type OrderDetailsPageProps = { params: Promise<{ checkoutSessionId: string }> };

export default async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const { checkoutSessionId } = await params;
  let order: Awaited<ReturnType<typeof getCheckoutOrderDetails>>;
  try {
    order = await getCheckoutOrderDetails(checkoutSessionId);
  } catch {
    notFound();
  }
  const completedAt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.completedAt));
  const orderId = `ORD-${checkoutSessionId.slice(0, 8).toUpperCase()}`;
  const purchasedItems = order.items.filter((item) => item.purchased);
  const pendingItems = order.items.filter((item) => !item.purchased);

  return <section className="mx-auto max-w-4xl space-y-6" aria-labelledby="order-details-heading">
    <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8"><p className="text-sm font-medium uppercase tracking-widest text-emerald-400/80">Completed order</p><h1 id="order-details-heading" className="mt-2 text-3xl font-semibold tracking-tight text-white">Order Details</h1><div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Order ID</p><p className="mt-1 font-mono text-sm font-semibold tracking-wide text-emerald-200">{orderId}</p></div><p className="text-sm text-zinc-400">Checked out {completedAt}</p></div><dl className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-white/[0.08] bg-black/10 p-3"><dt className="text-xs text-zinc-500">Shopping provider</dt><dd className="mt-1 flex items-center gap-2 text-sm font-semibold text-white"><ShoppingCart className="h-4 w-4 text-emerald-300" aria-hidden="true" />{order.providerName}</dd></div><Detail label="Week covered" value={formatWeekRange(order.weekStartDate)} /><div className="rounded-xl border border-white/[0.08] bg-black/10 p-3"><dt className="text-xs text-zinc-500">Meal plan status</dt><dd className="mt-2"><span className="inline-flex rounded-full border border-emerald-300/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-200" aria-label="Meal plan status: Purchased">Purchased</span></dd></div></dl></div>
    <div className="grid gap-4 sm:grid-cols-2"><Summary label="Purchased" value={order.purchasedCount} tone="emerald" /><Summary label="Pending" value={order.pendingCount} tone="amber" /></div>
    <OrderItems title="Purchased items" items={purchasedItems} purchased />
    <OrderItems title="Pending items" items={pendingItems} />
    <Link href="/dashboard/purchase-history" aria-label="Return to Purchase History" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-zinc-200 transition hover:bg-white/10"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Purchase History</Link>
  </section>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/[0.08] bg-black/10 p-3"><dt className="text-xs text-zinc-500">{label}</dt><dd className="mt-1 text-sm font-semibold text-white">{value}</dd></div>; }
function Summary({ label, value, tone }: { label: string; value: number; tone: "emerald" | "amber" }) { return <div className={`rounded-2xl border px-5 py-6 ${tone === "emerald" ? "border-emerald-400/20 bg-emerald-500/[0.08]" : "border-amber-300/20 bg-amber-400/[0.06]"}`}><p className={`text-sm font-medium ${tone === "emerald" ? "text-emerald-100" : "text-amber-100"}`}>{label}</p><p className={`mt-2 text-2xl font-semibold ${tone === "emerald" ? "text-emerald-200" : "text-amber-100"}`}>{value} <span className="text-base font-medium">Item{value === 1 ? "" : "s"}</span></p></div>; }
function OrderItems({ title, items, purchased = false }: { title: string; items: Awaited<ReturnType<typeof getCheckoutOrderDetails>>["items"]; purchased?: boolean }) { if (!items.length) return <p className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-5 py-6 text-center text-sm text-zinc-400">No {purchased ? "purchased" : "pending"} items in this order.</p>; return <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-7"><h2 className="text-lg font-semibold text-white">{title}</h2><ul className="mt-5 divide-y divide-white/[0.08] rounded-2xl border border-white/[0.08] px-4">{items.map((item) => { const quantity = item.manualAdjustmentQuantity === 0 ? roundShoppingQuantity(item.quantity, item.baseUnit) : displayShoppingQuantity(item.quantity, item.baseUnit); return <li key={item.id} className="flex items-center justify-between gap-4 py-4"><span className={`font-medium ${purchased ? "text-zinc-400 line-through" : "text-white"}`}>{item.name}</span><span className="shrink-0 text-xs font-medium text-zinc-500">{quantity.quantity} {quantity.unit}</span></li>; })}</ul></section>; }
