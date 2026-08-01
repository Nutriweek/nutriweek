import { createClient } from "@/lib/supabase/server";

import { parseBasketSnapshot } from "./helpers";

export type GrocerySnapshotCounts = { total: number; purchased: number; remaining: number };

/** Uses the same live-basket and completed-checkout sources as the Grocery List. */
export async function getGrocerySnapshotCounts(householdId: string, mealPlanId: string, planStatus: string): Promise<GrocerySnapshotCounts | null> {
  const supabase = await createClient();
  const { data: groceryList, error: groceryListError } = await supabase.from("grocery_lists").select("id").eq("household_id", householdId).eq("weekly_meal_plan_id", mealPlanId).maybeSingle();
  if (groceryListError) throw new Error("Unable to load your grocery snapshot.");
  if (!groceryList) return null;

  const isPurchasedPlan = planStatus === "purchased";
  const [{ data: items, error: itemsError }, { data: pantryItems, error: pantryItemsError }, { data: completedCheckoutSession, error: checkoutError }] = await Promise.all([
    supabase.from("grocery_list_items").select("id, ingredient_id, is_purchased").eq("grocery_list_id", groceryList.id).eq("is_removed", false),
    supabase.from("pantry_items").select("ingredient_id").eq("household_id", householdId).eq("available", true),
    isPurchasedPlan ? supabase.from("checkout_sessions").select("basket_snapshot").eq("grocery_list_id", groceryList.id).eq("status", "completed").order("completed_at", { ascending: false }).limit(1).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  if (itemsError || pantryItemsError || checkoutError) throw new Error("Unable to load your grocery snapshot.");

  const historicalItems = parseBasketSnapshot(completedCheckoutSession?.basket_snapshot);
  if (isPurchasedPlan && historicalItems.length > 0) {
    const purchased = historicalItems.filter((item) => item.purchased).length;
    return { total: historicalItems.length, purchased, remaining: historicalItems.length - purchased };
  }

  const pantryIngredientIds = new Set((pantryItems ?? []).map((item) => item.ingredient_id));
  const visibleItems = (items ?? []).filter((item) => !item.ingredient_id || !pantryIngredientIds.has(item.ingredient_id));
  const purchased = visibleItems.filter((item) => item.is_purchased).length;
  return { total: visibleItems.length, purchased, remaining: visibleItems.length - purchased };
}
