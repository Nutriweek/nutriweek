import Link from "next/link";

import CheckoutStepper from "@/components/grocery/CheckoutStepper";
import { getCheckoutSessionDetails, placeCheckoutSessionOrder } from "@/lib/grocery/checkoutSessions";
import { displayShoppingQuantity, roundShoppingQuantity } from "@/lib/grocery/roundShoppingQuantity";

type ReviewOrderPageProps = { searchParams: Promise<{ session?: string }> };

export default async function ReviewOrderPage({ searchParams }: ReviewOrderPageProps) {
  const { session } = await searchParams;
  const checkoutSession = await getCheckoutSessionDetails(session ?? "");

  return <section className="mx-auto max-w-3xl space-y-6" aria-labelledby="review-order-heading">
    <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
      <p className="text-sm font-medium uppercase tracking-widest text-emerald-400/80">Checkout</p>
      <h1 id="review-order-heading" className="mt-2 text-3xl font-semibold tracking-tight text-white">Review Your Order</h1>
      <p className="mt-2 text-sm text-zinc-400">Confirm your selected store and grocery items before placing your order.</p>
    </div>
    <CheckoutStepper currentStep={2} />
    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-7" aria-labelledby="store-heading"><h2 id="store-heading" className="text-lg font-semibold text-white">Store</h2><p className="mt-2 text-sm text-zinc-400">{checkoutSession.providerName}</p></section>
    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-7" aria-labelledby="items-heading"><div className="flex items-center justify-between gap-4"><h2 id="items-heading" className="text-lg font-semibold text-white">Items</h2><span className="text-sm text-zinc-400">{checkoutSession.selectedItems.length} item{checkoutSession.selectedItems.length === 1 ? "" : "s"}</span></div><ul className="mt-5 divide-y divide-white/[0.08] rounded-2xl border border-white/[0.08] px-4">{checkoutSession.selectedItems.map((item) => { const quantity = item.manualAdjustmentQuantity === 0 ? roundShoppingQuantity(item.quantity, item.baseUnit) : displayShoppingQuantity(item.quantity, item.baseUnit); return <li key={item.id} className="flex items-center justify-between gap-4 py-4"><span className="font-medium text-white">{item.name}</span><span className="shrink-0 text-sm font-medium text-emerald-300">{quantity.quantity} {quantity.unit}</span></li>; })}</ul></section>
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"><Link href={`/dashboard/grocery/select-store?session=${encodeURIComponent(session ?? "")}`} className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-zinc-200 transition hover:bg-white/10">Change Store</Link><form action={placeCheckoutSessionOrder}><input type="hidden" name="session" value={session ?? ""} /><button type="submit" className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300 sm:w-auto">Place Order</button></form></div>
  </section>;
}
