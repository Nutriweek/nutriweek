import { ShoppingBasket } from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type GroceryItem = {
  id: string;
  ingredient_id: string | null;
  custom_name: string | null;
  effective_quantity_base: number;
  base_unit_code: string;
  is_removed: boolean;
};

export default async function GroceryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in to view your grocery basket.");

  const { data: membership, error: membershipError } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (membershipError || !membership) throw new Error("Your household is not available yet. Please refresh and try again.");

  const { data: groceryList, error: groceryListError } = await supabase
    .from("grocery_lists")
    .select("id, weekly_meal_plan_id, status, estimated_total, currency_code")
    .eq("household_id", membership.household_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (groceryListError) throw new Error("Unable to load your grocery basket.");

  if (!groceryList) {
    return <EmptyBasket />;
  }

  const [{ data: plan, error: planError }, { data: items, error: itemsError }] = await Promise.all([
    supabase.from("weekly_meal_plans").select("week_start_date").eq("id", groceryList.weekly_meal_plan_id).maybeSingle(),
    supabase.from("grocery_list_items").select("id, ingredient_id, custom_name, effective_quantity_base, base_unit_code, is_removed").eq("grocery_list_id", groceryList.id).eq("is_removed", false).order("created_at"),
  ]);
  if (planError || itemsError) throw new Error("Unable to load your grocery basket items.");

  const groceryItems = (items ?? []) as GroceryItem[];
  const ingredientIds = groceryItems.flatMap((item) => item.ingredient_id ? [item.ingredient_id] : []);
  const { data: ingredients, error: ingredientsError } = ingredientIds.length > 0
    ? await supabase.from("ingredients").select("id, name").in("id", ingredientIds)
    : { data: [], error: null };
  if (ingredientsError) throw new Error("Unable to load grocery ingredient names.");
  const ingredientNames = new Map((ingredients ?? []).map((ingredient) => [ingredient.id, ingredient.name]));

  const currency = groceryList.currency_code ?? "INR";
  const total = groceryList.estimated_total === null ? null : new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(groceryList.estimated_total);
  const weekLabel = plan?.week_start_date ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${plan.week_start_date}T00:00:00.000Z`)) : "your approved week";

  return <section className="space-y-6" aria-labelledby="grocery-heading">
    <div className="flex flex-col gap-4 rounded-3xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-sm font-medium uppercase tracking-widest text-emerald-400/80">Approved meal plan</p><h1 id="grocery-heading" className="mt-2 text-3xl font-semibold tracking-tight text-white">Grocery basket</h1><p className="mt-2 text-sm text-zinc-400">Ingredients needed for the week starting {weekLabel}, adjusted for your pantry.</p></div>
      {total ? <p className="text-xl font-semibold text-emerald-300">{total}</p> : null}
    </div>
    <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-7">
      {groceryItems.length === 0 ? <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-zinc-500">This approved week does not need any additional grocery items.</p> : <ul className="divide-y divide-white/[0.08]">{groceryItems.map((item) => <li key={item.id} className="flex items-center justify-between gap-4 py-4"><span className="font-medium text-white">{item.ingredient_id ? ingredientNames.get(item.ingredient_id) ?? "Catalog ingredient" : item.custom_name}</span><span className="shrink-0 text-sm text-emerald-300">{item.effective_quantity_base} {item.base_unit_code}</span></li>)}</ul>}
    </div>
  </section>;
}

function EmptyBasket() {
  return <section className="flex min-h-[50vh] items-center justify-center" aria-labelledby="grocery-heading"><div className="w-full max-w-xl rounded-3xl border border-white/[0.08] bg-white/[0.04] p-8 text-center backdrop-blur-xl sm:p-10"><ShoppingBasket className="mx-auto h-10 w-10 text-emerald-400" aria-hidden="true" /><h1 id="grocery-heading" className="mt-4 text-3xl font-semibold tracking-tight text-white">No grocery basket yet</h1><p className="mx-auto mt-4 max-w-md leading-relaxed text-zinc-400">Approve a review-ready weekly meal plan to generate your pantry-adjusted grocery basket.</p></div></section>;
}
