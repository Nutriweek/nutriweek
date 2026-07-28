import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import CheckoutStepper from "@/components/grocery/CheckoutStepper";
import { getCheckoutConfirmation } from "@/lib/grocery/checkoutSessions";

type OrderConfirmationPageProps = { searchParams: Promise<{ session?: string }> };

export default async function OrderConfirmationPage({ searchParams }: OrderConfirmationPageProps) {
  const { session } = await searchParams;
  const confirmation = await getCheckoutConfirmation(session ?? "");

  return <section className="mx-auto max-w-3xl space-y-6" aria-labelledby="order-confirmation-heading">
    <CheckoutStepper currentStep={3} />
    <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/[0.08] p-6 text-center backdrop-blur-xl sm:p-10">
      <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-300" aria-hidden="true" />
      <h1 id="order-confirmation-heading" className="mt-4 text-3xl font-semibold tracking-tight text-white">Order Placed Successfully</h1>
      <dl className="mx-auto mt-6 grid max-w-md gap-3 text-left sm:grid-cols-2"><div className="rounded-xl border border-white/[0.08] bg-black/10 p-4"><dt className="text-xs text-zinc-500">Provider</dt><dd className="mt-1 text-sm font-semibold text-white">{confirmation.providerName}</dd></div><div className="rounded-xl border border-white/[0.08] bg-black/10 p-4"><dt className="text-xs text-zinc-500">Purchased items</dt><dd className="mt-1 text-sm font-semibold text-white">{confirmation.purchasedItemCount}</dd></div></dl>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center"><Link href="/dashboard/grocery" className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300">Return to Grocery List</Link><Link href="/dashboard/pantry" className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-zinc-200 transition hover:bg-white/10">Go to Pantry</Link></div>
    </div>
  </section>;
}
