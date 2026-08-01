"use server";

import { redirect } from "next/navigation";

import { completeGroceryPurchase } from "@/lib/grocery/actions";
import { parseBasketSnapshot, type BasketSnapshotItem } from "@/lib/grocery/helpers";
import { createClient } from "@/lib/supabase/server";

type CheckoutSessionResult = { success: true; sessionId: string } | { success: false; message: string };
export type CheckoutSessionDetails = {
  providerName: string;
  selectedItems: { id: string; name: string; quantity: number; unit: string; baseUnit: string; manualAdjustmentQuantity: number }[];
};
export type CheckoutConfirmation = { providerName: string; purchasedItemCount: number };
export type CheckoutOrderDetails = { providerName: string; completedAt: string; weekStartDate: string; mealPlanStatus: string; items: BasketSnapshotItem[]; purchasedCount: number; pendingCount: number };
export type CompletedCheckoutOrder = { id: string; providerName: string; completedAt: string; weekStartDate: string; purchasedCount: number; pendingCount: number };

async function getHouseholdContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, householdId: null };

  const { data: membership } = await supabase.from("household_members").select("household_id").eq("user_id", user.id).order("created_at", { ascending: true }).limit(1).maybeSingle();
  return { supabase, householdId: membership?.household_id ?? null };
}

export async function createCheckoutSession(groceryListId: string, itemIds: string[], basketItemIds: string[]): Promise<CheckoutSessionResult> {
  const selectedItemIds = [...new Set(itemIds)];
  const visibleBasketItemIds = [...new Set(basketItemIds)];
  if (!groceryListId || selectedItemIds.length === 0 || visibleBasketItemIds.length === 0 || selectedItemIds.some((itemId) => !visibleBasketItemIds.includes(itemId))) return { success: false, message: "Select at least one shopping item." };

  const { supabase, householdId } = await getHouseholdContext();
  if (!householdId) return { success: false, message: "Your household is not available." };

  const [{ data: groceryList, error: groceryListError }, { data: selectedGroceryItems, error: selectedGroceryItemsError }, { data: basketItems, error: basketItemsError }] = await Promise.all([
    supabase.from("grocery_lists").select("id").eq("id", groceryListId).eq("household_id", householdId).maybeSingle(),
    supabase.from("grocery_list_items").select("id").eq("grocery_list_id", groceryListId).in("id", selectedItemIds),
    supabase.from("grocery_list_items").select("id, ingredient_id, custom_name, effective_quantity_base, manual_adjustment_quantity_base, base_unit_code").eq("grocery_list_id", groceryListId).in("id", visibleBasketItemIds),
  ]);
  if (groceryListError || !groceryList || selectedGroceryItemsError || (selectedGroceryItems ?? []).length !== selectedItemIds.length || basketItemsError || (basketItems ?? []).length !== visibleBasketItemIds.length) return { success: false, message: "Your selected grocery items are no longer available." };

  const ingredientIds = (basketItems ?? []).flatMap((item) => item.ingredient_id ? [item.ingredient_id] : []);
  const { data: ingredients, error: ingredientsError } = ingredientIds.length > 0 ? await supabase.from("ingredients").select("id, name").in("id", ingredientIds) : { data: [], error: null };
  if (ingredientsError) return { success: false, message: "We could not save your grocery basket for checkout." };

  const ingredientNames = new Map((ingredients ?? []).map((ingredient) => [ingredient.id, ingredient.name]));
  const basketSnapshot = (basketItems ?? []).map((item) => ({ id: item.id, name: item.ingredient_id ? ingredientNames.get(item.ingredient_id) ?? "Catalog ingredient" : item.custom_name ?? "Custom item", quantity: item.effective_quantity_base, manualAdjustmentQuantity: item.manual_adjustment_quantity_base, baseUnit: item.base_unit_code, selectedForPurchase: selectedItemIds.includes(item.id), purchased: false }));

  const { data: checkoutSession, error } = await supabase.from("checkout_sessions").insert({ household_id: householdId, grocery_list_id: groceryListId, selected_grocery_item_ids: selectedItemIds, basket_snapshot: basketSnapshot }).select("id").single();
  if (error || !checkoutSession) return { success: false, message: "We could not start your checkout session." };
  return { success: true, sessionId: checkoutSession.id };
}

export async function selectCheckoutSessionProvider(formData: FormData) {
  const sessionId = formData.get("session");
  const providerId = formData.get("provider");
  if (typeof sessionId !== "string" || typeof providerId !== "string" || !sessionId || !providerId) throw new Error("A checkout session and shopping provider are required.");

  const { supabase, householdId } = await getHouseholdContext();
  if (!householdId) throw new Error("Your household is not available.");

  const { data: provider, error: providerError } = await supabase.from("shopping_providers").select("id").eq("id", providerId).maybeSingle();
  if (providerError || !provider) throw new Error("That shopping provider is no longer available.");

  const { data: checkoutSession, error } = await supabase.from("checkout_sessions").update({ selected_shopping_provider_id: provider.id }).eq("id", sessionId).eq("household_id", householdId).select("id").maybeSingle();
  if (error || !checkoutSession) throw new Error("We could not update your checkout session.");

  redirect(`/dashboard/grocery/review-order?session=${encodeURIComponent(checkoutSession.id)}`);
}

export async function getCheckoutSessionDetails(sessionId: string): Promise<CheckoutSessionDetails> {
  if (!sessionId) throw new Error("A checkout session is required.");
  const { supabase, householdId } = await getHouseholdContext();
  if (!householdId) throw new Error("Your household is not available.");

  const { data: checkoutSession, error: checkoutSessionError } = await supabase.from("checkout_sessions").select("grocery_list_id, selected_grocery_item_ids, selected_shopping_provider_id").eq("id", sessionId).eq("household_id", householdId).maybeSingle();
  if (checkoutSessionError || !checkoutSession || !checkoutSession.selected_shopping_provider_id) throw new Error("Your checkout session is no longer available.");

  const [{ data: provider, error: providerError }, { data: groceryItems, error: groceryItemsError }] = await Promise.all([
    supabase.from("shopping_providers").select("name").eq("id", checkoutSession.selected_shopping_provider_id).maybeSingle(),
    supabase.from("grocery_list_items").select("id, ingredient_id, custom_name, effective_quantity_base, manual_adjustment_quantity_base, base_unit_code").eq("grocery_list_id", checkoutSession.grocery_list_id).in("id", checkoutSession.selected_grocery_item_ids),
  ]);
  if (providerError || !provider || groceryItemsError || (groceryItems ?? []).length !== checkoutSession.selected_grocery_item_ids.length) throw new Error("Unable to load your checkout session.");

  const ingredientIds = (groceryItems ?? []).flatMap((item) => item.ingredient_id ? [item.ingredient_id] : []);
  const { data: ingredients, error: ingredientsError } = ingredientIds.length > 0 ? await supabase.from("ingredients").select("id, name").in("id", ingredientIds) : { data: [], error: null };
  if (ingredientsError) throw new Error("Unable to load your checkout items.");

  const ingredientNames = new Map((ingredients ?? []).map((ingredient) => [ingredient.id, ingredient.name]));
  const itemsById = new Map((groceryItems ?? []).map((item) => [item.id, item]));
  const selectedItems = checkoutSession.selected_grocery_item_ids.flatMap((itemId: string) => {
    const item = itemsById.get(itemId);
    return item ? [{ id: item.id, name: item.ingredient_id ? ingredientNames.get(item.ingredient_id) ?? "Catalog ingredient" : item.custom_name ?? "Custom item", quantity: item.effective_quantity_base, unit: item.base_unit_code, baseUnit: item.base_unit_code, manualAdjustmentQuantity: item.manual_adjustment_quantity_base }] : [];
  });
  return { providerName: provider.name, selectedItems };
}

export async function placeCheckoutSessionOrder(formData: FormData) {
  const sessionId = formData.get("session");
  if (typeof sessionId !== "string" || !sessionId) throw new Error("A checkout session is required.");

  const { supabase, householdId } = await getHouseholdContext();
  if (!householdId) throw new Error("Your household is not available.");

  const { data: checkoutSession, error: checkoutSessionError } = await supabase.from("checkout_sessions").select("grocery_list_id, selected_grocery_item_ids, selected_shopping_provider_id, basket_snapshot, status").eq("id", sessionId).eq("household_id", householdId).maybeSingle();
  console.info("[checkout place] session lookup", {
    sessionId,
    checkoutSession,
    selectedShoppingProviderId: checkoutSession?.selected_shopping_provider_id,
    status: checkoutSession?.status,
    selectedGroceryItemIds: checkoutSession?.selected_grocery_item_ids,
    checkoutSessionError,
  });
  const basketSnapshot = parseBasketSnapshot(checkoutSession?.basket_snapshot);
  if (checkoutSessionError || !checkoutSession || checkoutSession.status === "completed" || !checkoutSession.selected_shopping_provider_id || basketSnapshot.length === 0 || checkoutSession.selected_grocery_item_ids.some((itemId: string) => !basketSnapshot.some((snapshotItem) => snapshotItem.id === itemId && snapshotItem.selectedForPurchase))) throw new Error("Your checkout session is no longer available.");

  const [{ data: provider, error: providerError }, { data: groceryItems, error: groceryItemsError }, { data: groceryList, error: groceryListError }] = await Promise.all([
    supabase.from("shopping_providers").select("id").eq("id", checkoutSession.selected_shopping_provider_id).maybeSingle(),
    supabase.from("grocery_list_items").select("id").eq("grocery_list_id", checkoutSession.grocery_list_id).in("id", checkoutSession.selected_grocery_item_ids),
    supabase.from("grocery_lists").select("weekly_meal_plan_id").eq("id", checkoutSession.grocery_list_id).maybeSingle(),
  ]);
  if (providerError || !provider || groceryItemsError || (groceryItems ?? []).length !== checkoutSession.selected_grocery_item_ids.length || groceryListError || !groceryList) throw new Error("Your selected grocery items are no longer available.");

  const purchaseResult = await completeGroceryPurchase(checkoutSession.selected_grocery_item_ids);
  if (!purchaseResult.success) throw new Error(purchaseResult.message);

  const completedBasketSnapshot = basketSnapshot.map((item) => checkoutSession.selected_grocery_item_ids.includes(item.id) ? { ...item, purchased: true } : item);
  const { error: completionError } = await supabase.from("checkout_sessions").update({ status: "completed", completed_at: new Date().toISOString(), basket_snapshot: completedBasketSnapshot }).eq("id", sessionId).eq("household_id", householdId);
  if (completionError) throw new Error("Your purchase was completed, but we could not finish your checkout session.");

  const { error: mealPlanError } = await supabase.from("weekly_meal_plans").update({ status: "purchased" }).eq("id", groceryList.weekly_meal_plan_id).eq("household_id", householdId);
  if (mealPlanError) throw new Error("Your purchase was completed, but we could not mark the meal plan as purchased.");

  redirect(`/dashboard/grocery/order-confirmation?session=${encodeURIComponent(sessionId)}`);
}

export async function getCheckoutConfirmation(sessionId: string): Promise<CheckoutConfirmation> {
  if (!sessionId) throw new Error("A checkout session is required.");
  const { supabase, householdId } = await getHouseholdContext();
  if (!householdId) throw new Error("Your household is not available.");

  const { data: checkoutSession, error: checkoutSessionError } = await supabase.from("checkout_sessions").select("selected_grocery_item_ids, selected_shopping_provider_id, status").eq("id", sessionId).eq("household_id", householdId).maybeSingle();
  if (checkoutSessionError || !checkoutSession || checkoutSession.status !== "completed" || !checkoutSession.selected_shopping_provider_id) throw new Error("Your completed checkout session is not available.");

  const { data: provider, error: providerError } = await supabase.from("shopping_providers").select("name").eq("id", checkoutSession.selected_shopping_provider_id).maybeSingle();
  if (providerError || !provider) throw new Error("Unable to load your order confirmation.");

  return { providerName: provider.name, purchasedItemCount: checkoutSession.selected_grocery_item_ids.length };
}

export async function getCheckoutOrderDetails(sessionId: string): Promise<CheckoutOrderDetails> {
  if (!sessionId) throw new Error("An order is required.");
  const { supabase, householdId } = await getHouseholdContext();
  if (!householdId) throw new Error("Your household is not available.");

  const { data: checkoutSession, error: checkoutSessionError } = await supabase.from("checkout_sessions").select("grocery_list_id, selected_shopping_provider_id, basket_snapshot, completed_at, status").eq("id", sessionId).eq("household_id", householdId).maybeSingle();
  if (checkoutSessionError || !checkoutSession || checkoutSession.status !== "completed" || !checkoutSession.selected_shopping_provider_id || !checkoutSession.completed_at) throw new Error("This completed order is not available.");

  const [{ data: provider, error: providerError }, { data: groceryList, error: groceryListError }] = await Promise.all([
    supabase.from("shopping_providers").select("name").eq("id", checkoutSession.selected_shopping_provider_id).maybeSingle(),
    supabase.from("grocery_lists").select("weekly_meal_plan_id").eq("id", checkoutSession.grocery_list_id).maybeSingle(),
  ]);
  if (providerError || !provider || groceryListError || !groceryList) throw new Error("Unable to load this order.");

  const { data: mealPlan, error: mealPlanError } = await supabase.from("weekly_meal_plans").select("week_start_date, status").eq("id", groceryList.weekly_meal_plan_id).maybeSingle();
  if (mealPlanError || !mealPlan) throw new Error("Unable to load this order.");

  const items = parseBasketSnapshot(checkoutSession.basket_snapshot);
  if (items.length === 0) throw new Error("This order does not contain a basket snapshot.");
  return { providerName: provider.name, completedAt: checkoutSession.completed_at, weekStartDate: mealPlan.week_start_date, mealPlanStatus: mealPlan.status, items, purchasedCount: items.filter((item) => item.purchased).length, pendingCount: items.filter((item) => !item.purchased).length };
}

export async function getCompletedCheckoutOrders(): Promise<CompletedCheckoutOrder[]> {
  const { supabase, householdId } = await getHouseholdContext();
  if (!householdId) throw new Error("Your household is not available.");

  const { data: sessions, error: sessionsError } = await supabase.from("checkout_sessions").select("id, grocery_list_id, selected_shopping_provider_id, basket_snapshot, completed_at").eq("household_id", householdId).eq("status", "completed").order("completed_at", { ascending: false });
  if (sessionsError) throw new Error("Unable to load purchase history.");

  const completedSessions = (sessions ?? []).filter((session) => session.completed_at && session.selected_shopping_provider_id);
  if (completedSessions.length === 0) return [];
  const [providersResult, groceryListsResult] = await Promise.all([
    supabase.from("shopping_providers").select("id, name").in("id", completedSessions.map((session) => session.selected_shopping_provider_id as string)),
    supabase.from("grocery_lists").select("id, weekly_meal_plan_id").in("id", completedSessions.map((session) => session.grocery_list_id)),
  ]);
  if (providersResult.error || groceryListsResult.error) throw new Error("Unable to load purchase history.");
  const groceryLists = groceryListsResult.data ?? [];
  const { data: mealPlans, error: mealPlansError } = groceryLists.length > 0 ? await supabase.from("weekly_meal_plans").select("id, week_start_date").in("id", groceryLists.map((list) => list.weekly_meal_plan_id)) : { data: [], error: null };
  if (mealPlansError) throw new Error("Unable to load purchase history.");

  const providerNames = new Map((providersResult.data ?? []).map((provider) => [provider.id, provider.name]));
  const planIdByGroceryListId = new Map(groceryLists.map((list) => [list.id, list.weekly_meal_plan_id]));
  const weekStartByPlanId = new Map((mealPlans ?? []).map((plan) => [plan.id, plan.week_start_date]));
  return completedSessions.flatMap((session) => {
    const weekStartDate = weekStartByPlanId.get(planIdByGroceryListId.get(session.grocery_list_id) ?? "");
    const providerName = providerNames.get(session.selected_shopping_provider_id as string);
    const items = parseBasketSnapshot(session.basket_snapshot);
    return session.completed_at && weekStartDate && providerName && items.length > 0 ? [{ id: session.id, providerName, completedAt: session.completed_at, weekStartDate, purchasedCount: items.filter((item) => item.purchased).length, pendingCount: items.filter((item) => !item.purchased).length }] : [];
  });
}

