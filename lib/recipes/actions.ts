"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import { recipeFormSchema, type RecipeFormInput } from "./schemas";
import type { RecipeActionResult } from "./types";

function toSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function createRecipe(values: RecipeFormInput): Promise<RecipeActionResult> {
  // Base values are internal planning fields. The author enters the recipe amount
  // and unit; this keeps the required normalized pair in sync before validation.
  const normalizedValues: RecipeFormInput = {
    ...values,
    ingredients: values.ingredients.map((ingredient) => ({
      ...ingredient,
      base_quantity: ingredient.quantity,
      base_unit_code: ingredient.unit_code.trim(),
    })),
  };
  const parsed = recipeFormSchema.safeParse(normalizedValues);
  if (!parsed.success) return { success: false, message: "Please correct the recipe details and try again." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Please sign in before creating a recipe." };

  const value = parsed.data;
  const slugBase = toSlug(value.name);
  const slug = `${slugBase}-${crypto.randomUUID().slice(0, 8)}`;
  const { data: recipe, error: recipeError } = await supabase.from("recipes").insert({
    source_type: "user",
    source_id: "user",
    visibility: "private",
    created_by: user.id,
    name: value.name,
    slug,
    description: value.description || null,
    primary_cuisine_id: value.primary_cuisine_id,
    primary_cuisine_region_id: value.primary_cuisine_region_id,
    servings: value.servings,
    difficulty: value.difficulty,
    prep_time_minutes: value.prep_time_minutes,
    cook_time_minutes: value.cook_time_minutes,
    total_time_minutes: (value.prep_time_minutes ?? 0) + (value.cook_time_minutes ?? 0),
    calories_kcal: value.calories_kcal,
    protein_g: value.protein_g,
    carbohydrates_g: value.carbohydrates_g,
    fat_g: value.fat_g,
    fiber_g: value.fiber_g,
    sugar_g: value.sugar_g,
    sodium_mg: value.sodium_mg,
    nutrition_source: value.calories_kcal === null ? null : "manual",
    nutrition_updated_at: value.calories_kcal === null ? null : new Date().toISOString(),
  }).select("id").single();
  if (recipeError || !recipe) return { success: false, message: "We could not create this recipe." };

  const [ingredientsResult, stepsResult, categoriesResult, tagsResult, equipmentResult] = await Promise.all([
    supabase.from("recipe_ingredients").insert(value.ingredients.map((ingredient, index) => ({ ...ingredient, recipe_id: recipe.id, display_order: index + 1, preparation_note: ingredient.preparation_note || null, base_unit_code: ingredient.base_unit_code || null }))),
    supabase.from("recipe_steps").insert(value.steps.map((step, index) => ({ ...step, recipe_id: recipe.id, step_number: index + 1, tip: step.tip || null }))),
    supabase.from("recipe_meal_categories").insert(value.meal_category_ids.map((meal_category_id) => ({ recipe_id: recipe.id, meal_category_id }))),
    value.tag_ids.length ? supabase.from("recipe_tag_assignments").insert(value.tag_ids.map((tag_id) => ({ recipe_id: recipe.id, tag_id }))) : Promise.resolve({ error: null }),
    value.equipment_ids.length ? supabase.from("recipe_equipment_requirements").insert(value.equipment_ids.map((equipment_id) => ({ recipe_id: recipe.id, equipment_id }))) : Promise.resolve({ error: null }),
  ]);
  if (ingredientsResult.error || stepsResult.error || categoriesResult.error || tagsResult.error || equipmentResult.error) {
    await supabase.from("recipes").delete().eq("id", recipe.id);
    return { success: false, message: "We could not save every recipe detail. Nothing was published." };
  }

  revalidatePath("/dashboard/recipes");
  revalidatePath("/dashboard/meal-plans");
  return { success: true, message: "Your private recipe has been saved.", recipeId: recipe.id };
}
