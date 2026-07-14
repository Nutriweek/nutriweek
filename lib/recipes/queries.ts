import { createClient } from "@/lib/supabase/server";

import type { RecipeCatalogItem } from "./types";

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
