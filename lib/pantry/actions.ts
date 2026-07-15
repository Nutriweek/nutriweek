"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type PantryActionResult = {
  success: boolean;
  message: string;
};

async function getCurrentHousehold() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, householdId: null };

  const { data, error } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error("Unable to load your household.");
  return { supabase, householdId: data?.household_id ?? null };
}

export async function addIngredientToPantry(ingredientId: string): Promise<PantryActionResult> {
  const { supabase, householdId } = await getCurrentHousehold();
  if (!householdId) return { success: false, message: "Your household is not available yet." };

  const { data: ingredient, error: ingredientError } = await supabase
    .from("ingredients")
    .select("id, default_unit_code")
    .eq("id", ingredientId)
    .eq("is_active", true)
    .maybeSingle();

  if (ingredientError || !ingredient) return { success: false, message: "Choose an available ingredient." };

  const { data: existing, error: existingError } = await supabase
    .from("pantry_items")
    .select("id")
    .eq("household_id", householdId)
    .eq("ingredient_id", ingredient.id)
    .maybeSingle();

  if (existingError) return { success: false, message: "We could not check your pantry." };

  const baseUnitCode = ingredient.default_unit_code ?? "unit";
  const result = existing
    ? await supabase.from("pantry_items").update({ available: true, base_unit_code: baseUnitCode }).eq("id", existing.id)
    : await supabase.from("pantry_items").insert({
      household_id: householdId,
      ingredient_id: ingredient.id,
      available: true,
      quantity_base: 1,
      base_unit_code: baseUnitCode,
    });

  if (result.error) return { success: false, message: "We could not update your pantry." };

  revalidatePath("/dashboard/pantry");
  revalidatePath("/dashboard/grocery");
  return { success: true, message: "Ingredient added to your Kitchen Pantry." };
}

export async function removePantryItem(pantryItemId: string): Promise<PantryActionResult> {
  const { supabase, householdId } = await getCurrentHousehold();
  if (!householdId) return { success: false, message: "Your household is not available yet." };

  const { error } = await supabase
    .from("pantry_items")
    .delete()
    .eq("id", pantryItemId)
    .eq("household_id", householdId);

  if (error) return { success: false, message: "We could not remove this pantry item." };

  revalidatePath("/dashboard/pantry");
  revalidatePath("/dashboard/grocery");
  return { success: true, message: "Ingredient removed from your Kitchen Pantry." };
}

export async function setPantryItemAvailability(pantryItemId: string, available: boolean): Promise<PantryActionResult> {
  const { supabase, householdId } = await getCurrentHousehold();
  if (!householdId) return { success: false, message: "Your household is not available yet." };

  const { error } = await supabase
    .from("pantry_items")
    .update({ available })
    .eq("id", pantryItemId)
    .eq("household_id", householdId);

  if (error) return { success: false, message: "We could not update this pantry item." };

  revalidatePath("/dashboard/pantry");
  revalidatePath("/dashboard/grocery");
  return { success: true, message: available ? "Ingredient marked available." : "Ingredient marked finished." };
}
