"use client";

import { CheckCircle2, PackageCheck, PackageX, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import SearchableCombobox from "@/components/ui/SearchableCombobox";
import { addIngredientToPantry, removePantryItem, setPantryItemAvailability } from "@/lib/pantry/actions";

type PantryIngredient = {
  id: string;
  name: string;
};

type PantryItem = {
  id: string;
  ingredientId: string;
  name: string;
  available: boolean;
};

type PantryManagerProps = {
  ingredients: PantryIngredient[];
  pantryItems: PantryItem[];
};

export default function PantryManager({ ingredients, pantryItems }: PantryManagerProps) {
  const router = useRouter();
  const pantryIngredientIds = useMemo(() => new Set(pantryItems.map((item) => item.ingredientId)), [pantryItems]);
  const addableIngredients = useMemo(
    () => ingredients.filter((ingredient) => !pantryIngredientIds.has(ingredient.id)),
    [ingredients, pantryIngredientIds],
  );
  const addableIngredientOptions = useMemo(
    () => addableIngredients.map((ingredient) => ({ value: ingredient.id, label: ingredient.name })),
    [addableIngredients],
  );
  const [selectedIngredientId, setSelectedIngredientId] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const selectedValue = addableIngredients.some((ingredient) => ingredient.id === selectedIngredientId)
    ? selectedIngredientId
    : "";

  function runAction(action: () => Promise<{ success: boolean; message: string }>) {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      setMessage({ type: result.success ? "success" : "error", text: result.message });
      if (result.success) router.refresh();
    });
  }

  function handleAddIngredient() {
    if (!selectedValue) return;
    runAction(() => addIngredientToPantry(selectedValue));
  }

  return <div className="space-y-6">
    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-7" aria-labelledby="add-pantry-item-heading">
      <div className="mb-5 flex items-start gap-3">
        <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-300"><PackageCheck className="h-5 w-5" aria-hidden="true" /></div>
        <div>
          <h2 id="add-pantry-item-heading" className="text-xl font-semibold text-white">Add Ingredient</h2>
          <p className="mt-1 text-sm text-zinc-400">Keep only the ingredients you normally have at home.</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <SearchableCombobox
          options={addableIngredientOptions}
          value={selectedValue}
          onValueChange={setSelectedIngredientId}
          placeholder={addableIngredients.length === 0 ? "All ingredients are already in Pantry" : "Search ingredients..."}
          searchPlaceholder="Search ingredients..."
          emptyMessage="No ingredients found."
          disabled={addableIngredients.length === 0}
          ariaLabel="Search pantry ingredients"
        />
        <button type="button" onClick={handleAddIngredient} disabled={isPending || addableIngredients.length === 0 || selectedValue === ""} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60">
          <Plus className="h-5 w-5" aria-hidden="true" />
          Add Ingredient
        </button>
      </div>
      {message ? <p className={`mt-4 flex items-center gap-2 text-sm ${message.type === "success" ? "text-emerald-300" : "text-rose-300"}`} role={message.type === "error" ? "alert" : "status"}>{message.type === "success" ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : null}{message.text}</p> : null}
    </section>

    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-7" aria-labelledby="pantry-items-heading">
      <div className="mb-4"><h2 id="pantry-items-heading" className="text-lg font-semibold text-white">Kitchen Pantry</h2><p className="mt-1 text-sm text-zinc-400">Available ingredients are removed from grocery shopping.</p></div>
      {pantryItems.length === 0 ? <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-zinc-500">No pantry ingredients yet.</p> : <ul className="divide-y divide-white/[0.08]">
        {pantryItems.map((item) => <li key={item.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-white">{item.name}</p>
            <p className={`mt-1 text-sm ${item.available ? "text-emerald-300" : "text-zinc-500"}`}>{item.available ? "Available" : "Finished"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => runAction(() => setPantryItemAvailability(item.id, !item.available))} disabled={isPending} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60">
              {item.available ? <PackageX className="h-4 w-4" aria-hidden="true" /> : <PackageCheck className="h-4 w-4" aria-hidden="true" />}
              {item.available ? "Mark Finished" : "Mark Available"}
            </button>
            <button type="button" onClick={() => runAction(() => removePantryItem(item.id))} disabled={isPending} className="inline-flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-200 transition hover:border-rose-300/50 hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-60">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Remove
            </button>
          </div>
        </li>)}
      </ul>}
    </section>
  </div>;
}
