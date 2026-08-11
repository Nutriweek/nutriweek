import { Store } from "lucide-react";

import StoreOrderInbox from "@/components/store/StoreOrderInbox";
import { getStoreOrderInbox } from "@/lib/local-store/storeOrders";

export default async function StoreOrdersPage() {
  const inbox = await getStoreOrderInbox();

  if (!inbox.hasStoreAccess) {
    return <section className="mx-auto max-w-4xl rounded-3xl border border-white/[0.08] bg-white/[0.04] p-6 text-center backdrop-blur-xl sm:p-10"><Store className="mx-auto h-12 w-12 text-zinc-500" aria-hidden="true" /><h1 className="mt-5 text-2xl font-semibold text-white">Store access is not available</h1><p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-zinc-400">This account is not an active member of a Nutriweek local store.</p></section>;
  }

  return <section className="mx-auto max-w-4xl space-y-6" aria-labelledby="store-orders-heading"><div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8"><p className="text-sm font-medium uppercase tracking-widest text-emerald-400/80">Local Store</p><h1 id="store-orders-heading" className="mt-2 text-3xl font-semibold tracking-tight text-white">Store orders</h1><p className="mt-2 text-sm text-zinc-400">Review available grocery orders and accept the ones your store can fulfill.</p></div><StoreOrderInbox availableOrders={inbox.availableOrders} assignedOrders={inbox.assignedOrders} /></section>;
}
