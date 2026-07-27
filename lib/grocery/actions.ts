"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function updateGroceryItemQuantity(itemId: string, quantity: number) {
  if (!Number.isFinite(quantity) || quantity <= 0) return { success: false, message: "Quantity must be greater than zero." };
  const supabase = await createClient();
  const { data: item, error: itemError } = await supabase.from("grocery_list_items").select("id, generated_quantity_base").eq("id", itemId).maybeSingle();
  if (itemError || !item) return { success: false, message: "This grocery item is no longer available." };
  const { error } = await supabase.from("grocery_list_items").update({
    effective_quantity_base: quantity,
    manual_adjustment_quantity_base: quantity - item.generated_quantity_base,
  }).eq("id", item.id);
  if (error) return { success: false, message: "We could not update this grocery quantity." };
  revalidatePath("/dashboard/grocery");
  return { success: true, message: "Shopping quantity updated." };
}

export async function completeGroceryPurchase(itemIds: string[]) {
  if (itemIds.length === 0) return { success: false, message: "Select at least one shopping item." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_grocery_purchase", { item_ids: [...new Set(itemIds)] });
  if (error) return { success: false, message: "We could not complete this purchase." };
  revalidatePath("/dashboard/grocery");
  return { success: true, message: "Purchase completed." };
}
