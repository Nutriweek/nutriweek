"use server";

import { redirect } from "next/navigation";

import { completeGroceryPurchase } from "@/lib/grocery/actions";
import { createClient } from "@/lib/supabase/server";

type CheckoutSessionResult = { success: true; sessionId: string } | { success: false; message: string };
export type CheckoutSessionDetails = {
  providerName: string;
  selectedItems: { id: string; name: string; quantity: number; unit: string; baseUnit: string; manualAdjustmentQuantity: number }[];
};
export type CheckoutConfirmation = { providerName: string; purchasedItemCount: number };

async function getHouseholdContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, householdId: null };

  const { data: membership } = await supabase.from("household_members").select("household_id").eq("user_id", user.id).order("created_at", { ascending: true }).limit(1).maybeSingle();
  return { supabase, householdId: membership?.household_id ?? null };
}

export async function createCheckoutSession(groceryListId: string, itemIds: string[]): Promise<CheckoutSessionResult> {
  const selectedItemIds = [...new Set(itemIds)];
  if (!groceryListId || selectedItemIds.length === 0) return { success: false, message: "Select at least one shopping item." };

  const { supabase, householdId } = await getHouseholdContext();
  if (!householdId) return { success: false, message: "Your household is not available." };

  const [{ data: groceryList, error: groceryListError }, { data: groceryItems, error: groceryItemsError }] = await Promise.all([
    supabase.from("grocery_lists").select("id").eq("id", groceryListId).eq("household_id", householdId).maybeSingle(),
    supabase.from("grocery_list_items").select("id").eq("grocery_list_id", groceryListId).in("id", selectedItemIds),
  ]);
  if (groceryListError || !groceryList || groceryItemsError || (groceryItems ?? []).length !== selectedItemIds.length) return { success: false, message: "Your selected grocery items are no longer available." };

  const { data: checkoutSession, error } = await supabase.from("checkout_sessions").insert({ household_id: householdId, grocery_list_id: groceryListId, selected_grocery_item_ids: selectedItemIds }).select("id").single();
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

  const { data: checkoutSession, error: checkoutSessionError } = await supabase.from("checkout_sessions").select("grocery_list_id, selected_grocery_item_ids, selected_shopping_provider_id, status").eq("id", sessionId).eq("household_id", householdId).maybeSingle();
  console.info("[checkout place] session lookup", {
    sessionId,
    checkoutSession,
    selectedShoppingProviderId: checkoutSession?.selected_shopping_provider_id,
    status: checkoutSession?.status,
    selectedGroceryItemIds: checkoutSession?.selected_grocery_item_ids,
    checkoutSessionError,
  });
  if (checkoutSessionError || !checkoutSession || checkoutSession.status === "completed" || !checkoutSession.selected_shopping_provider_id) throw new Error("Your checkout session is no longer available.");

  const [{ data: provider, error: providerError }, { data: groceryItems, error: groceryItemsError }] = await Promise.all([
    supabase.from("shopping_providers").select("id").eq("id", checkoutSession.selected_shopping_provider_id).maybeSingle(),
    supabase.from("grocery_list_items").select("id").eq("grocery_list_id", checkoutSession.grocery_list_id).in("id", checkoutSession.selected_grocery_item_ids),
  ]);
  if (providerError || !provider || groceryItemsError || (groceryItems ?? []).length !== checkoutSession.selected_grocery_item_ids.length) throw new Error("Your selected grocery items are no longer available.");

  const purchaseResult = await completeGroceryPurchase(checkoutSession.selected_grocery_item_ids);
  if (!purchaseResult.success) throw new Error(purchaseResult.message);

  const { error: completionError } = await supabase.from("checkout_sessions").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", sessionId).eq("household_id", householdId);
  if (completionError) throw new Error("Your purchase was completed, but we could not finish your checkout session.");

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
