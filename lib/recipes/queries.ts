import { createClient } from "@/lib/supabase/server";

import type { RecipeCatalogItem, RecipeDetails } from "./types";

export async function getRecipeCatalog(search = ""): Promise<RecipeCatalogItem[]> {
  const supabase = await createClient();
  const term = search.trim().slice(0, 80);

  const catalogQuery = supabase.from("recipes").select("id, name, description, servings, total_time_minutes, difficulty, estimated_cost, estimated_cost_currency, cover_image_path").eq("is_active", true).in("visibility", ["system", "public"]);
  const { data: recipeRows, error } = term
    ? await catalogQuery.or(`name.ilike.%${term}%,description.ilike.%${term}%`).order("name").limit(60)
    : await catalogQuery.order("name").limit(60);
  if (error) throw new Error("Unable to load recipes.");

  const recipeIds = (recipeRows ?? []).map((recipe) => recipe.id);
  if (recipeIds.length === 0) return [];
  const [{ data: scores }, { data: assignments }, { data: tags }] = await Promise.all([
    supabase.from("recipe_quality_scores").select("recipe_id, score").in("recipe_id", recipeIds),
    supabase.from("recipe_tag_assignments").select("recipe_id, tag_id").in("recipe_id", recipeIds),
    supabase.from("recipe_tags").select("id, name, slug").eq("is_active", true),
  ]);
  const scoreByRecipe = new Map((scores ?? []).map((score) => [score.recipe_id, score.score]));
  const tagsById = new Map((tags ?? []).map((tag) => [tag.id, tag]));
  const tagsByRecipe = new Map<string, NonNullable<typeof tags>>();
  for (const assignment of assignments ?? []) {
    const tag = tagsById.get(assignment.tag_id);
    if (tag) tagsByRecipe.set(assignment.recipe_id, [...(tagsByRecipe.get(assignment.recipe_id) ?? []), tag]);
  }
  return recipeRows.map((recipe) => ({ ...recipe, qualityScore: scoreByRecipe.get(recipe.id) ?? 0, tags: tagsByRecipe.get(recipe.id) ?? [] })).sort((left, right) => right.qualityScore - left.qualityScore || left.name.localeCompare(right.name));
}

export async function getRecipeEditorData() {
  const supabase = await createClient();
  const [{ data: ingredients }, { data: mealCategories }, { data: cuisines }, { data: tags }, { data: equipment }] = await Promise.all([
    supabase.from("ingredients").select("id, name, default_unit_code").eq("is_active", true).order("name").limit(1000),
    supabase.from("meal_categories").select("id, name").eq("is_active", true).order("display_order"),
    supabase.from("cuisines").select("id, name").eq("is_active", true).order("name"),
    supabase.from("recipe_tags").select("id, name, category").eq("is_active", true).order("name"),
    supabase.from("equipment").select("id, name").eq("is_active", true).order("name"),
  ]);
  return { ingredients: ingredients ?? [], mealCategories: mealCategories ?? [], cuisines: cuisines ?? [], tags: tags ?? [], equipment: equipment ?? [] };
}

export async function getRecipeDetails(recipeId: string): Promise<RecipeDetails | null> {
  const supabase = await createClient();
  const { data: recipe, error: recipeError } = await supabase.from("recipes").select("id, name, description, cover_image_path, difficulty, prep_time_minutes, cook_time_minutes, total_time_minutes, servings, calories_kcal, protein_g, carbohydrates_g, fat_g, fiber_g, sugar_g, sodium_mg, primary_cuisine_id, primary_cuisine_region_id").eq("id", recipeId).eq("is_active", true).maybeSingle();
  if (recipeError) throw new Error("Unable to load this recipe.");
  if (!recipe) return null;

  const [{ data: recipeIngredients, error: ingredientsError }, { data: recipeSteps, error: stepsError }, { data: tagAssignments, error: tagAssignmentsError }, { data: categoryAssignments, error: categoryAssignmentsError }, { data: equipmentRequirements, error: equipmentRequirementsError }, { data: primaryCuisine, error: cuisineError }, { data: primaryRegion, error: regionError }] = await Promise.all([
    supabase.from("recipe_ingredients").select("id, ingredient_id, quantity, unit_code, preparation_note, is_optional, display_order").eq("recipe_id", recipe.id).order("display_order"),
    supabase.from("recipe_steps").select("id, step_number, instruction, tip").eq("recipe_id", recipe.id).order("step_number"),
    supabase.from("recipe_tag_assignments").select("tag_id").eq("recipe_id", recipe.id),
    supabase.from("recipe_meal_categories").select("meal_category_id").eq("recipe_id", recipe.id),
    supabase.from("recipe_equipment_requirements").select("equipment_id").eq("recipe_id", recipe.id).eq("is_required", true),
    recipe.primary_cuisine_id ? supabase.from("cuisines").select("name").eq("id", recipe.primary_cuisine_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    recipe.primary_cuisine_region_id ? supabase.from("cuisine_regions").select("name").eq("id", recipe.primary_cuisine_region_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  if (ingredientsError || stepsError || tagAssignmentsError || categoryAssignmentsError || equipmentRequirementsError || cuisineError || regionError) throw new Error("Unable to load this recipe's details.");

  const ingredientIds = (recipeIngredients ?? []).map((item) => item.ingredient_id);
  const tagIds = (tagAssignments ?? []).map((item) => item.tag_id);
  const categoryIds = (categoryAssignments ?? []).map((item) => item.meal_category_id);
  const equipmentIds = (equipmentRequirements ?? []).map((item) => item.equipment_id);
  const [{ data: ingredients, error: ingredientNamesError }, { data: tags, error: tagsError }, { data: categories, error: categoriesError }, { data: equipment, error: equipmentError }] = await Promise.all([
    ingredientIds.length ? supabase.from("ingredients").select("id, name").in("id", ingredientIds) : Promise.resolve({ data: [], error: null }),
    tagIds.length ? supabase.from("recipe_tags").select("id, name, slug").in("id", tagIds).eq("is_active", true) : Promise.resolve({ data: [], error: null }),
    categoryIds.length ? supabase.from("meal_categories").select("id, name").in("id", categoryIds) : Promise.resolve({ data: [], error: null }),
    equipmentIds.length ? supabase.from("equipment").select("id, name").in("id", equipmentIds).eq("is_active", true) : Promise.resolve({ data: [], error: null }),
  ]);
  if (ingredientNamesError || tagsError || categoriesError || equipmentError) throw new Error("Unable to load this recipe's details.");

  const ingredientNames = new Map((ingredients ?? []).map((ingredient) => [ingredient.id, ingredient.name]));
  const tagById = new Map((tags ?? []).map((tag) => [tag.id, tag]));
  const categoryById = new Map((categories ?? []).map((category) => [category.id, category.name]));
  const equipmentById = new Map((equipment ?? []).map((item) => [item.id, item.name]));
  return {
    recipe,
    cuisine: primaryRegion?.name ?? primaryCuisine?.name ?? null,
    mealCategories: categoryIds.flatMap((id) => categoryById.get(id) ? [categoryById.get(id) as string] : []),
    tags: tagIds.flatMap((id) => tagById.get(id) ? [tagById.get(id) as NonNullable<typeof tags>[number]] : []),
    ingredients: (recipeIngredients ?? []).map((item) => ({ id: item.id, name: ingredientNames.get(item.ingredient_id) ?? "Ingredient", quantity: item.quantity, unit: item.unit_code, preparationNote: item.preparation_note, isOptional: item.is_optional })),
    steps: (recipeSteps ?? []).map((step) => ({ id: step.id, stepNumber: step.step_number, instruction: step.instruction, tip: step.tip })),
    equipment: equipmentIds.flatMap((id) => equipmentById.get(id) ? [equipmentById.get(id) as string] : []),
  };
}
