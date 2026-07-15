import { ShoppingBasket } from "lucide-react";

import GroceryBasket, { type GroceryBasketItem } from "@/components/grocery/GroceryBasket";
import { formatWeekRange } from "@/lib/meal-plans";
import { createClient } from "@/lib/supabase/server";

type GroceryItem = {
  id: string;
  ingredient_id: string | null;
  custom_name: string | null;
  effective_quantity_base: number;
  base_unit_code: string;
  estimated_total_cost: number | null;
  is_removed: boolean;
};

type GroceryItemSource = {
  grocery_list_item_id: string;
  weekly_meal_plan_item_id: string | null;
  recipe_id: string | null;
};

type MealPlanSourceItem = {
  id: string;
  meal_date: string;
  meal_category_id: string;
  recipe_id: string | null;
  title: string | null;
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
    .select("id, weekly_meal_plan_id, status, currency_code")
    .eq("household_id", membership.household_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (groceryListError) throw new Error("Unable to load your grocery basket.");

  if (!groceryList) {
    return <EmptyBasket />;
  }

  const [{ data: plan, error: planError }, { data: items, error: itemsError }, { count: mealCount, error: mealCountError }] = await Promise.all([
    supabase.from("weekly_meal_plans").select("week_start_date").eq("id", groceryList.weekly_meal_plan_id).maybeSingle(),
    supabase.from("grocery_list_items").select("id, ingredient_id, custom_name, effective_quantity_base, base_unit_code, estimated_total_cost, is_removed").eq("grocery_list_id", groceryList.id).eq("is_removed", false).order("created_at"),
    supabase.from("weekly_meal_plan_items").select("id", { count: "exact", head: true }).eq("meal_plan_id", groceryList.weekly_meal_plan_id),
  ]);
  if (planError || itemsError || mealCountError) throw new Error("Unable to load your grocery basket items.");

  const groceryItems = (items ?? []) as GroceryItem[];
  const ingredientIds = groceryItems.flatMap((item) => item.ingredient_id ? [item.ingredient_id] : []);
  const groceryItemIds = groceryItems.map((item) => item.id);
  const [
    { data: ingredients, error: ingredientsError },
    { data: itemSources, error: itemSourcesError },
  ] = await Promise.all([
    ingredientIds.length > 0
      ? supabase.from("ingredients").select("id, name").in("id", ingredientIds)
      : Promise.resolve({ data: [], error: null }),
    groceryItemIds.length > 0
      ? supabase.from("grocery_list_item_sources").select("grocery_list_item_id, weekly_meal_plan_item_id, recipe_id").in("grocery_list_item_id", groceryItemIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (ingredientsError) throw new Error("Unable to load grocery ingredient names.");
  if (itemSourcesError) throw new Error("Unable to load grocery usage details.");

  const sources = (itemSources ?? []) as GroceryItemSource[];
  const mealPlanItemIds = [...new Set(sources.flatMap((source) => source.weekly_meal_plan_item_id ? [source.weekly_meal_plan_item_id] : []))];
  const recipeSourceIds = [...new Set(sources.flatMap((source) => source.recipe_id ? [source.recipe_id] : []))];
  const { data: mealPlanItems, error: mealPlanItemsError } = mealPlanItemIds.length > 0
    ? await supabase.from("weekly_meal_plan_items").select("id, meal_date, meal_category_id, recipe_id, title").in("id", mealPlanItemIds)
    : { data: [], error: null };
  if (mealPlanItemsError) throw new Error("Unable to load meal usage details.");

  const sourceMealPlanItems = (mealPlanItems ?? []) as MealPlanSourceItem[];
  const mealCategoryIds = [...new Set(sourceMealPlanItems.map((item) => item.meal_category_id))];
  const recipeIds = [...new Set([
    ...recipeSourceIds,
    ...sourceMealPlanItems.flatMap((item) => item.recipe_id ? [item.recipe_id] : []),
  ])];
  const [
    { data: mealCategories, error: mealCategoriesError },
    { data: recipes, error: recipesError },
  ] = await Promise.all([
    mealCategoryIds.length > 0
      ? supabase.from("meal_categories").select("id, name").in("id", mealCategoryIds)
      : Promise.resolve({ data: [], error: null }),
    recipeIds.length > 0
      ? supabase.from("recipes").select("id, name").in("id", recipeIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (mealCategoriesError || recipesError) throw new Error("Unable to load meal usage labels.");

  const ingredientNames = new Map((ingredients ?? []).map((ingredient) => [ingredient.id, ingredient.name]));
  const mealCategoryNames = new Map((mealCategories ?? []).map((category) => [category.id, category.name]));
  const recipeNames = new Map((recipes ?? []).map((recipe) => [recipe.id, recipe.name]));
  const mealPlanItemsById = new Map(sourceMealPlanItems.map((item) => [item.id, item]));
  const sourcesByGroceryItemId = new Map<string, GroceryBasketItem["usedIn"]>();
  const weekdayFormatter = new Intl.DateTimeFormat("en-IN", { weekday: "long", timeZone: "UTC" });
  for (const source of sources) {
    if (!source.weekly_meal_plan_item_id) continue;
    const mealPlanItem = mealPlanItemsById.get(source.weekly_meal_plan_item_id);
    if (!mealPlanItem) continue;

    const sourceRecipeId = source.recipe_id ?? mealPlanItem.recipe_id;
    const usedIn = sourcesByGroceryItemId.get(source.grocery_list_item_id) ?? [];
    if (!usedIn.some((entry) => entry.mealPlanItemId === mealPlanItem.id)) {
      usedIn.push({
        mealPlanItemId: mealPlanItem.id,
        mealLabel: `${weekdayFormatter.format(new Date(`${mealPlanItem.meal_date}T00:00:00.000Z`))} ${mealCategoryNames.get(mealPlanItem.meal_category_id) ?? "Meal"}`,
        recipeName: sourceRecipeId ? recipeNames.get(sourceRecipeId) ?? mealPlanItem.title ?? "Planned meal" : mealPlanItem.title ?? "Planned meal",
      });
    }
    sourcesByGroceryItemId.set(source.grocery_list_item_id, usedIn);
  }

  const currency = groceryList.currency_code ?? "INR";
  const weekLabel = plan?.week_start_date ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${plan.week_start_date}T00:00:00.000Z`)) : "your approved week";
  const basketItems: GroceryBasketItem[] = groceryItems.map((item) => ({
    id: item.id,
    name: item.ingredient_id ? ingredientNames.get(item.ingredient_id) ?? "Catalog ingredient" : item.custom_name ?? "Custom item",
    quantity: item.effective_quantity_base,
    unit: item.base_unit_code,
    estimatedCost: item.estimated_total_cost,
    usedIn: sourcesByGroceryItemId.get(item.id) ?? [],
  }));
  const estimatedBasketCost = basketItems.reduce((total, item) => total + (item.estimatedCost ?? 0), 0);
  const hasEstimatedBasketCost = basketItems.some((item) => item.estimatedCost !== null);
  const currencyFormatter = new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 });
  const weekRange = plan?.week_start_date ? formatWeekRange(plan.week_start_date) : "—";

  return <section className="space-y-6" aria-labelledby="grocery-heading">
    <div className="flex flex-col gap-4 rounded-3xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-sm font-medium uppercase tracking-widest text-emerald-400/80">Approved meal plan</p><h1 id="grocery-heading" className="mt-2 text-3xl font-semibold tracking-tight text-white">Grocery basket</h1><p className="mt-2 text-sm text-zinc-400">Ingredients needed for the week starting {weekLabel}, adjusted for your pantry.</p></div>
      <dl className="grid grid-cols-3 gap-3 text-left sm:min-w-[28rem]"><SummaryItem label="Week" value={weekRange} /><SummaryItem label="Meals planned" value={mealCount === null ? "—" : String(mealCount)} /><SummaryItem label="Estimated cost" value={hasEstimatedBasketCost ? currencyFormatter.format(estimatedBasketCost) : "—"} /></dl>
    </div>
    {basketItems.length === 0 ? <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-7"><p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-zinc-500">This approved week does not need any additional grocery items.</p></div> : <GroceryBasket currency={currency} items={basketItems} />}
  </section>;
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/[0.08] bg-black/10 p-3"><dt className="text-xs text-zinc-500">{label}</dt><dd className="mt-1 text-sm font-semibold text-white">{value}</dd></div>;
}

function EmptyBasket() {
  return <section className="flex min-h-[50vh] items-center justify-center" aria-labelledby="grocery-heading"><div className="w-full max-w-xl rounded-3xl border border-white/[0.08] bg-white/[0.04] p-8 text-center backdrop-blur-xl sm:p-10"><ShoppingBasket className="mx-auto h-10 w-10 text-emerald-400" aria-hidden="true" /><h1 id="grocery-heading" className="mt-4 text-3xl font-semibold tracking-tight text-white">No grocery basket yet</h1><p className="mx-auto mt-4 max-w-md leading-relaxed text-zinc-400">Approve a review-ready weekly meal plan to generate your pantry-adjusted grocery basket.</p></div></section>;
}
