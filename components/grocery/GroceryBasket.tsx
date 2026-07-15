"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { addIngredientToPantry } from "@/lib/pantry/actions";

export type GroceryBasketItem = {
  id: string;
  ingredientId: string | null;
  name: string;
  quantity: number;
  unit: string;
  estimatedCost: number | null;
  usedIn: {
    mealPlanItemId: string;
    mealLabel: string;
    recipeName: string;
  }[];
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
  const router = useRouter();
  const [selectedItemIds, setSelectedItemIds] = useState(() => new Set(items.map((item) => item.id)));
  const [expandedItemIds, setExpandedItemIds] = useState(() => new Set<string>());
  const [pendingRemovalItem, setPendingRemovalItem] = useState<GroceryBasketItem | null>(null);
  const [removalReason, setRemovalReason] = useState<"already_have" | "dont_need">("already_have");
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [isRemoving, startRemovalTransition] = useTransition();
  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }),
    [currency],
  );
  const selectedItems = items.filter((item) => selectedItemIds.has(item.id));
  const estimatedCost = selectedItems.reduce((total, item) => total + (item.estimatedCost ?? 0), 0);
  const hasEstimatedCost = selectedItems.some((item) => item.estimatedCost !== null);
  const estimatedCostLabel = hasEstimatedCost ? currencyFormatter.format(estimatedCost) : "-";

  function toggleItem(item: GroceryBasketItem) {
    setCheckoutMessage(null);
    if (selectedItemIds.has(item.id)) {
      setPendingRemovalItem(item);
      setRemovalReason(item.ingredientId ? "already_have" : "dont_need");
      return;
    }

    setSelectedItemIds((current) => {
      const next = new Set(current);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
  }

  function removeSelectedItem(item: GroceryBasketItem) {
    setSelectedItemIds((current) => {
      const next = new Set(current);
      next.delete(item.id);
      return next;
    });
  }

  function confirmRemoval() {
    if (!pendingRemovalItem) return;
    const item = pendingRemovalItem;

    if (removalReason === "already_have" && item.ingredientId) {
      const ingredientId = item.ingredientId;
      startRemovalTransition(async () => {
        const result = await addIngredientToPantry(ingredientId);
        if (!result.success) {
          setCheckoutMessage(result.message);
          return;
        }

        removeSelectedItem(item);
        setPendingRemovalItem(null);
        router.refresh();
      });
      return;
    }

    startRemovalTransition(() => {
      removeSelectedItem(item);
      setPendingRemovalItem(null);
    });
  }

  function toggleExpanded(itemId: string) {
    setExpandedItemIds((current) => {
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
          const isExpanded = expandedItemIds.has(item.id);
          return <li key={item.id}>
            <div className={`py-4 transition ${isSelected ? "" : "opacity-50"}`}>
              <div onClick={() => toggleItem(item)} className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={isSelected} onChange={() => toggleItem(item)} onClick={(event) => event.stopPropagation()} className="mt-1 h-5 w-5 shrink-0 accent-emerald-400" />
                <div className="min-w-0 flex-1">
                  <span className="block font-medium text-white">{item.name}</span>
                  <span className="mt-1 block text-sm text-emerald-300">{item.quantity} {item.unit}</span>
                  <button type="button" onClick={(event) => { event.stopPropagation(); toggleExpanded(item.id); }} className="mt-2 inline-flex items-center gap-1 text-sm text-zinc-400 transition hover:text-zinc-200" aria-expanded={isExpanded}>
                    Used in {item.usedIn.length} meal{item.usedIn.length === 1 ? "" : "s"}
                    <ChevronDown className={`h-4 w-4 transition ${isExpanded ? "rotate-180" : ""}`} aria-hidden="true" />
                  </button>
                </div>
                <span className={`shrink-0 pt-1 text-sm font-medium ${isSelected ? "text-white" : "text-zinc-500"}`}>{item.estimatedCost === null ? "-" : currencyFormatter.format(item.estimatedCost)}</span>
              </div>
              {isExpanded && item.usedIn.length > 0 ? <div className="mt-3 rounded-2xl border border-white/[0.08] bg-black/15 p-3">
                <ul className="space-y-3">
                  {item.usedIn.map((usage) => <li key={usage.mealPlanItemId} className="text-sm">
                    <p className="font-medium text-zinc-300">{usage.mealLabel}</p>
                    <p className="mt-1 text-zinc-500">{usage.recipeName}</p>
                  </li>)}
                </ul>
              </div> : null}
            </div>
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
    <ConfirmationModal
      open={Boolean(pendingRemovalItem)}
      title="Why are you removing this ingredient?"
      description={pendingRemovalItem ? pendingRemovalItem.name : undefined}
      icon={<span aria-hidden="true">!</span>}
      confirmText="Remove Ingredient"
      cancelText="Keep Ingredient"
      destructive
      loading={isRemoving}
      onCancel={() => setPendingRemovalItem(null)}
      onConfirm={confirmRemoval}
    >
      <div className="space-y-3">
        <label className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition ${removalReason === "already_have" ? "border-emerald-400/40 bg-emerald-500/10" : "border-white/[0.08] bg-black/15"} ${pendingRemovalItem?.ingredientId ? "" : "cursor-not-allowed opacity-50"}`}>
          <input type="radio" name="removal-reason" value="already_have" checked={removalReason === "already_have"} disabled={!pendingRemovalItem?.ingredientId} onChange={() => setRemovalReason("already_have")} className="mt-1 h-4 w-4 accent-emerald-400" />
          <span>
            <span className="block font-medium text-white">I already have it</span>
            <span className="mt-1 block text-sm text-zinc-400">Add this ingredient to Kitchen Pantry and remove it from shopping.</span>
          </span>
        </label>
        <label className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition ${removalReason === "dont_need" ? "border-emerald-400/40 bg-emerald-500/10" : "border-white/[0.08] bg-black/15"}`}>
          <input type="radio" name="removal-reason" value="dont_need" checked={removalReason === "dont_need"} onChange={() => setRemovalReason("dont_need")} className="mt-1 h-4 w-4 accent-emerald-400" />
          <span>
            <span className="block font-medium text-white">I don&apos;t need it</span>
            <span className="mt-1 block text-sm text-zinc-400">Remove it from this grocery basket only.</span>
          </span>
        </label>
      </div>
    </ConfirmationModal>
  </div>;
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4"><p className="text-sm text-zinc-400">{label}</p><p className="mt-2 text-xl font-semibold text-white">{value}</p></div>;
}
