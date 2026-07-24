"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import { recipeFormSchema, type RecipeFormInput } from "./schemas";
import type { RecipeActionResult } from "./types";
import { getRecipeDetails } from "./queries";

const supportedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const supportedImageExtensions = new Set(["jpg", "jpeg", "png", "webp"]);

function toSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function normalizeRecipeName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

async function hasDuplicateRecipeName(recipeName: string, userId: string, excludeRecipeId?: string) {
  const supabase = await createClient();
  const [systemRecipes, userRecipes] = await Promise.all([
    supabase.from("recipes").select("id, name").eq("is_active", true).eq("source_type", "system"),
    supabase.from("recipes").select("id, name").eq("is_active", true).eq("source_type", "user").eq("created_by", userId),
  ]);
  if (systemRecipes.error || userRecipes.error) return false;
  const target = normalizeRecipeName(recipeName);
  return [...(systemRecipes.data ?? []), ...(userRecipes.data ?? [])].some((recipe) => recipe.id !== excludeRecipeId && normalizeRecipeName(recipe.name) === target);
}

function getOwnedRecipeImagePath(url: string | null, userId: string) {
  if (!url) return null;
  const marker = "/recipe-images/";
  const markerIndex = url.indexOf(marker);
  if (markerIndex === -1) return null;
  const path = decodeURIComponent(url.slice(markerIndex + marker.length));
  return path.startsWith(`${userId}/`) ? path : null;
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
  if (await hasDuplicateRecipeName(value.name, user.id)) return { success: false, message: "A Nutriweek recipe or one of your recipes already uses this name." };
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
    cover_image_path: value.cover_image_path,
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

export async function updateRecipe(recipeId: string, values: RecipeFormInput): Promise<RecipeActionResult> {
  const normalizedValues = { ...values, ingredients: values.ingredients.map((ingredient) => ({ ...ingredient, base_quantity: ingredient.quantity, base_unit_code: ingredient.unit_code.trim() })) };
  const parsed = recipeFormSchema.safeParse(normalizedValues);
  if (!parsed.success) return { success: false, message: "Please correct the recipe details and try again." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Please sign in before editing a recipe." };
  const value = parsed.data;
  if (await hasDuplicateRecipeName(value.name, user.id, recipeId)) return { success: false, message: "A Nutriweek recipe or one of your recipes already uses this name." };
  const { error: recipeError } = await supabase.from("recipes").update({
    name: value.name, description: value.description || null, cover_image_path: value.cover_image_path,
    servings: value.servings, difficulty: value.difficulty, prep_time_minutes: value.prep_time_minutes,
    cook_time_minutes: value.cook_time_minutes, total_time_minutes: (value.prep_time_minutes ?? 0) + (value.cook_time_minutes ?? 0),
  }).eq("id", recipeId).eq("source_type", "user").eq("created_by", user.id);
  if (recipeError) return { success: false, message: "We could not update this recipe." };
  const [removeIngredients, removeSteps, removeCategories] = await Promise.all([
    supabase.from("recipe_ingredients").delete().eq("recipe_id", recipeId),
    supabase.from("recipe_steps").delete().eq("recipe_id", recipeId),
    supabase.from("recipe_meal_categories").delete().eq("recipe_id", recipeId),
  ]);
  if (removeIngredients.error || removeSteps.error || removeCategories.error) return { success: false, message: "We could not update every recipe detail." };
  const [ingredientsResult, stepsResult, categoriesResult] = await Promise.all([
    supabase.from("recipe_ingredients").insert(value.ingredients.map((ingredient, index) => ({ ...ingredient, recipe_id: recipeId, display_order: index + 1, preparation_note: ingredient.preparation_note || null, base_unit_code: ingredient.base_unit_code || null }))),
    supabase.from("recipe_steps").insert(value.steps.map((step, index) => ({ ...step, recipe_id: recipeId, step_number: index + 1, tip: step.tip || null }))),
    supabase.from("recipe_meal_categories").insert(value.meal_category_ids.map((meal_category_id) => ({ recipe_id: recipeId, meal_category_id }))),
  ]);
  if (ingredientsResult.error || stepsResult.error || categoriesResult.error) return { success: false, message: "We could not save every recipe detail." };
  revalidatePath("/dashboard/recipes");
  return { success: true, message: "Your recipe has been updated.", recipeId };
}

export async function deleteRecipe(recipeId: string): Promise<RecipeActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Please sign in before deleting a recipe." };
  const { data: recipe, error: recipeError } = await supabase.from("recipes").select("cover_image_path").eq("id", recipeId).eq("source_type", "user").eq("created_by", user.id).maybeSingle();
  if (recipeError || !recipe) return { success: false, message: "We could not find this recipe." };
  const imagePath = getOwnedRecipeImagePath(recipe.cover_image_path, user.id);
  if (imagePath) {
    const { error: imageError } = await supabase.storage.from("recipe-images").remove([imagePath]);
    if (imageError) return { success: false, message: "We could not remove this recipe image. The recipe was not deleted." };
  }
  const { error } = await supabase.from("recipes").delete().eq("id", recipeId).eq("source_type", "user").eq("created_by", user.id);
  if (error) return { success: false, message: "We could not delete this recipe." };
  revalidatePath("/dashboard/recipes");
  return { success: true, message: "Your recipe has been deleted.", recipeId };
}

export async function getRecipeDetailsAction(recipeId: string) {
  return getRecipeDetails(recipeId);
}

export async function uploadRecipeImage(formData: FormData): Promise<{ success: boolean; url?: string; message?: string }> {
  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) return { success: false, message: "Choose an image to upload." };
  const extension = image.name.split(".").pop()?.toLowerCase() ?? "";
  if (!supportedImageTypes.has(image.type) || !supportedImageExtensions.has(extension)) return { success: false, message: "Use a JPG, JPEG, PNG, or WebP image." };
  if (image.size > 5 * 1024 * 1024) return { success: false, message: "Use an image smaller than 5 MB." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Please sign in before uploading an image." };
  const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("recipe-images").upload(path, image, { contentType: image.type, upsert: false });
  if (error) return { success: false, message: `We could not upload that image: ${error.message}` };
  const { data } = supabase.storage.from("recipe-images").getPublicUrl(path);
  return { success: true, url: data.publicUrl };
}
