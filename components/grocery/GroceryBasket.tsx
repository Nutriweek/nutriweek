"use client";

import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

export type GroceryBasketItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  estimatedCost: number | null;
};

type GroceryBasketProps = {
  currency: string;
  items: GroceryBasketItem[];
};

const providers = [
  { name: "Blinkit", deliveryTime: "~20 mins" },
  { name: "Zepto", deliveryTime: "~25 mins" },
  { name: "Instamart", deliveryTime: "~30 mins" },
];

export default function GroceryBasket({ currency, items }: GroceryBasketProps) {
  const [selectedItemIds, setSelectedItemIds] = useState(() => new Set(items.map((item) => item.id)));
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }),
    [currency],
  );
  const selectedItems = items.filter((item) => selectedItemIds.has(item.id));
  const estimatedCost = selectedItems.reduce((total, item) => total + (item.estimatedCost ?? 0), 0);
  const hasEstimatedCost = selectedItems.some((item) => item.estimatedCost !== null);
  const estimatedCostLabel = hasEstimatedCost ? currencyFormatter.format(estimatedCost) : "—";

  function toggleItem(itemId: string) {
    setCheckoutMessage(null);
    setSelectedItemIds((current) => {
      const next = new Set(current);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  return <div className="space-y-5">
    <section className="grid gap-3 sm:grid-cols-3" aria-label="Basket summary">
      <SummaryCard label="Total items" value={String(items.length)} />
      <SummaryCard label="Estimated cost" value={estimatedCostLabel} />
      <SummaryCard label="Remaining selected items" value={String(selectedItems.length)} />
    </section>

    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-7" aria-labelledby="grocery-items-heading">
      <div className="mb-4"><h2 id="grocery-items-heading" className="text-lg font-semibold text-white">Your basket</h2><p className="mt-1 text-sm text-zinc-400">Select the ingredients you want to purchase this week.</p></div>
      <ul className="divide-y divide-white/[0.08]">
        {items.map((item) => {
          const isSelected = selectedItemIds.has(item.id);
          return <li key={item.id}>
            <label className={`flex cursor-pointer items-center gap-3 py-4 transition ${isSelected ? "" : "opacity-50"}`}>
              <input type="checkbox" checked={isSelected} onChange={() => toggleItem(item.id)} className="h-5 w-5 shrink-0 accent-emerald-400" />
              <span className="min-w-0 flex-1"><span className="block font-medium text-white">{item.name}</span><span className="mt-1 block text-sm text-emerald-300">{item.quantity} {item.unit}</span></span>
              <span className={`shrink-0 text-sm font-medium ${isSelected ? "text-white" : "text-zinc-500"}`}>{item.estimatedCost === null ? "—" : currencyFormatter.format(item.estimatedCost)}</span>
            </label>
          </li>;
        })}
      </ul>
    </section>

    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-7" aria-labelledby="provider-comparison-heading">
      <div><h2 id="provider-comparison-heading" className="text-lg font-semibold text-white">Compare providers</h2><p className="mt-1 text-sm text-zinc-400">Prices below use the current basket estimate. Live provider pricing is coming soon.</p></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">{providers.map((provider) => <article key={provider.name} className="rounded-2xl border border-white/[0.08] bg-black/15 p-4"><h3 className="font-medium text-white">{provider.name}</h3><p className="mt-3 text-lg font-semibold text-emerald-300">{estimatedCostLabel}</p><p className="mt-1 text-xs text-zinc-500">{provider.deliveryTime}</p></article>)}</div>
    </section>

    <div className="flex flex-col gap-3 rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-emerald-100">{selectedItems.length} item{selectedItems.length === 1 ? "" : "s"} selected</p><p className="mt-1 text-sm text-emerald-100/70">{estimatedCostLabel}</p></div><button type="button" onClick={() => setCheckoutMessage("Store selection will be available when a grocery provider is connected.")} disabled={selectedItems.length === 0} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50">Choose Grocery Store <ChevronRight className="h-5 w-5" aria-hidden="true" /></button></div>
    {checkoutMessage ? <p className="text-center text-sm text-zinc-400" role="status">{checkoutMessage}</p> : null}
  </div>;
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4"><p className="text-sm text-zinc-400">{label}</p><p className="mt-2 text-xl font-semibold text-white">{value}</p></div>;
}
