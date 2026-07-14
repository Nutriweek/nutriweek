"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { Json, Tables } from "@/lib/supabase/database.types";

import { getUpcomingWeekStart, getWeekEnd } from "@/lib/meal-plans/constants";

import { approveWeeklyPlanSchema, prepareWeeklyPlanSchema, type ApproveWeeklyPlanInput, type PrepareWeeklyPlanInput } from "./schemas";
import type { PlanningActionResult, PlanningRecipe } from "./types";

type PlannedRecipeItem = Pick<Tables<"weekly_meal_plan_items">, "id" | "recipe_id" | "servings">;
type RecipeIngredient = Pick<Tables<"recipe_ingredients">, "recipe_id" | "ingredient_id" | "base_quantity" | "base_unit_code">;
type GroceryRequirement = {
  quantity: number;
  unit: string;
  sources: { planItemId: string; recipeId: string; quantity: number }[];
};

async function getPlanningContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, householdId: null };

  const { data: membership } = await supabase.from("household_members").select("household_id").eq("user_id", user.id).order("created_at").limit(1).maybeSingle();
  return { supabase, user, householdId: membership?.household_id ?? null };
}

function dateForOffset(weekStartDate: string, offset: number) {
  const date = new Date(`${weekStartDate}T00:00:00`);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

export async function prepareWeeklyPlan(values: PrepareWeeklyPlanInput): Promise<PlanningActionResult> {
  const parsed = prepareWeeklyPlanSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: "Choose a valid planning week." };
  if (parsed.data.week_start_date !== getUpcomingWeekStart()) {
    return { success: false, message: "You can only prepare the upcoming Monday–Saturday week." };
  }

  const { supabase, user, householdId } = await getPlanningContext();
  if (!user || !householdId) return { success: false, message: "Your household is not available yet." };

  const [{ data: profile }, { data: systemRecipes }, { data: privateRecipes }, { data: categories }, { data: slotTypes }, { data: preferences }] = await Promise.all([
    supabase.from("profiles").select("diet_type, allergies, kitchen_equipment, weekly_grocery_budget, currency_code").eq("id", user.id).maybeSingle(),
    supabase.from("recipes").select("id, name, servings, calories_kcal, prep_time_minutes, cook_time_minutes, source_type").eq("source_type", "system").eq("visibility", "system").eq("publication_status", "published").eq("is_active", true).order("name").limit(100),
    supabase.from("recipes").select("id, name, servings, calories_kcal, prep_time_minutes, cook_time_minutes, source_type").eq("source_type", "user").eq("created_by", user.id).eq("visibility", "private").eq("is_active", true).order("name").limit(100),
    supabase.from("meal_categories").select("id, slug").in("slug", ["breakfast", "lunch", "dinner"]).order("display_order"),
    supabase.from("meal_slot_types").select("id, slug").eq("slug", "recipe").maybeSingle(),
    supabase.from("household_planning_preferences").select("weekly_cooking_holiday").eq("household_id", householdId).maybeSingle(),
  ]);

  const recipes = [...(systemRecipes ?? []), ...(privateRecipes ?? [])];
  if (recipes.length === 0 || !categories || categories.length === 0 || !slotTypes) {
    return { success: false, message: "No eligible published recipes are available yet." };
  }

  const recipeIds = recipes.map((recipe) => recipe.id);
  const [{ data: dietCompatibility }, { data: requiredEquipment }, { data: structuredEquipmentRequirements }, { data: recipeIngredients }, { data: ingredientAllergens }, { data: qualityScores }, { data: mealCategoryAssignments }] = await Promise.all([
    supabase.from("recipe_diet_compatibilities").select("recipe_id, diet_type").in("recipe_id", recipeIds),
    supabase.from("recipe_required_equipment").select("recipe_id, equipment_name").in("recipe_id", recipeIds),
    supabase.from("recipe_equipment_requirements").select("recipe_id, equipment_id, is_required").in("recipe_id", recipeIds).eq("is_required", true),
    supabase.from("recipe_ingredients").select("recipe_id, ingredient_id").in("recipe_id", recipeIds),
    supabase.from("ingredient_allergens").select("ingredient_id, allergen_code"),
    supabase.from("recipe_quality_scores").select("recipe_id, score").in("recipe_id", recipeIds),
    supabase.from("recipe_meal_categories").select("recipe_id, meal_category_id").in("recipe_id", recipeIds),
  ]);

  const compatibleDiet = new Map<string, string[]>();
  for (const item of dietCompatibility ?? []) compatibleDiet.set(item.recipe_id, [...(compatibleDiet.get(item.recipe_id) ?? []), item.diet_type]);
  const equipmentByRecipe = new Map<string, string[]>();
  for (const item of requiredEquipment ?? []) equipmentByRecipe.set(item.recipe_id, [...(equipmentByRecipe.get(item.recipe_id) ?? []), item.equipment_name]);
  const equipmentIds = [...new Set((structuredEquipmentRequirements ?? []).map((item) => item.equipment_id))];
  const { data: equipmentCatalog } = equipmentIds.length > 0
    ? await supabase.from("equipment").select("id, name").in("id", equipmentIds)
    : { data: [] };
  const equipmentNamesById = new Map((equipmentCatalog ?? []).map((item) => [item.id, item.name]));
  for (const item of structuredEquipmentRequirements ?? []) {
    const equipmentName = equipmentNamesById.get(item.equipment_id);
    if (equipmentName) equipmentByRecipe.set(item.recipe_id, [...(equipmentByRecipe.get(item.recipe_id) ?? []), equipmentName]);
  }
  const allergensByIngredient = new Map((ingredientAllergens ?? []).map((item) => [item.ingredient_id, item.allergen_code]));
  const recipeAllergens = new Map<string, string[]>();
  for (const item of recipeIngredients ?? []) {
    const allergen = allergensByIngredient.get(item.ingredient_id);
    if (allergen) recipeAllergens.set(item.recipe_id, [...(recipeAllergens.get(item.recipe_id) ?? []), allergen]);
  }

  const qualityByRecipe = new Map((qualityScores ?? []).map((score) => [score.recipe_id, score.score]));
  const recipeIdsByMealCategory = new Map<string, Set<string>>();
  for (const assignment of mealCategoryAssignments ?? []) {
    recipeIdsByMealCategory.set(assignment.meal_category_id, new Set([...(recipeIdsByMealCategory.get(assignment.meal_category_id) ?? []), assignment.recipe_id]));
  }
  const eligibleRecipes = (recipes as PlanningRecipe[]).filter((recipe) => {
    const diets = compatibleDiet.get(recipe.id) ?? [];
    const required = equipmentByRecipe.get(recipe.id) ?? [];
    const allergens = recipeAllergens.get(recipe.id) ?? [];
    return (!profile?.diet_type || diets.length === 0 || diets.includes(profile.diet_type))
      && required.every((equipment) => profile?.kitchen_equipment.includes(equipment) ?? false)
      && !allergens.some((allergen) => profile?.allergies.map((value: string) => value.toLowerCase()).includes(allergen.toLowerCase()));
  }).sort((left, right) => {
    const leftScore = (qualityByRecipe.get(left.id) ?? 0) + (left.source_type === "system" ? 5 : 0);
    const rightScore = (qualityByRecipe.get(right.id) ?? 0) + (right.source_type === "system" ? 5 : 0);
    return rightScore - leftScore || left.name.localeCompare(right.name);
  });

  if (eligibleRecipes.length === 0) return { success: false, message: "No recipes match your current diet, allergy, and kitchen equipment constraints." };

  const { data: plan, error: planError } = await supabase.from("weekly_meal_plans").upsert(
    { household_id: householdId, week_start_date: parsed.data.week_start_date, status: "draft", generation_source: "deterministic" },
    { onConflict: "household_id,week_start_date" },
  ).select("id").single();
  if (planError || !plan) return { success: false, message: "We could not prepare this weekly plan." };

  await supabase.from("weekly_meal_plan_items").delete().eq("meal_plan_id", plan.id);
  const items = [] as { household_id: string; meal_plan_id: string; meal_date: string; meal_category_id: string; meal_slot_type_id: string; recipe_id: string; servings: number | null; slot_index: number }[];
  let recipeIndex = 0;
  for (let day = 0; day < 6; day += 1) {
    if (preferences?.weekly_cooking_holiday === day) continue;
    for (const category of categories) {
      const categoryRecipeIds = recipeIdsByMealCategory.get(category.id);
      const matchedCategoryRecipes = categoryRecipeIds ? eligibleRecipes.filter((recipe) => categoryRecipeIds.has(recipe.id)) : [];
      const categoryRecipes = matchedCategoryRecipes.length > 0 ? matchedCategoryRecipes : eligibleRecipes;
      const recipe = categoryRecipes[recipeIndex % categoryRecipes.length];
      recipeIndex += 1;
      items.push({ household_id: householdId, meal_plan_id: plan.id, meal_date: dateForOffset(parsed.data.week_start_date, day), meal_category_id: category.id, meal_slot_type_id: slotTypes.id, recipe_id: recipe.id, servings: recipe.servings, slot_index: 0 });
    }
  }
  const { data: savedItems, error: itemsError } = await supabase.from("weekly_meal_plan_items").insert(items).select("id, recipe_id, meal_category_id");
  if (itemsError) return { success: false, message: "We could not save the prepared meal slots." };

  const { data: run, error: runError } = await supabase.from("meal_plan_generation_runs").insert({ household_id: householdId, meal_plan_id: plan.id, generation_source: "deterministic", created_by: user.id, input_snapshot: { diet_type: profile?.diet_type, allergies: profile?.allergies ?? [], kitchen_equipment: profile?.kitchen_equipment ?? [], budget: profile?.weekly_grocery_budget, currency: profile?.currency_code }, output_snapshot: { recipe_ids: eligibleRecipes.map((recipe) => recipe.id), meal_slot_count: items.length } }).select("id").single();
  if (!runError && run) {
    const explanations = [
      { generation_run_id: run.id, explanation_code: "diet", message: profile?.diet_type ? "Matches your selected diet." : "Uses recipes from your available catalog.", metadata: {} },
      ...(profile?.allergies.length ? [{ generation_run_id: run.id, explanation_code: "allergies", message: "Avoids recipes containing your recorded allergens.", metadata: {} }] : []),
      ...(profile?.kitchen_equipment.length ? [{ generation_run_id: run.id, explanation_code: "equipment", message: "Uses recipes compatible with your available kitchen equipment.", metadata: {} }] : []),
      ...(preferences?.weekly_cooking_holiday !== null && preferences?.weekly_cooking_holiday !== undefined ? [{ generation_run_id: run.id, explanation_code: "cooking_holiday", message: "Includes your selected weekly cooking holiday.", metadata: {} }] : []),
    ];
    await supabase.from("meal_plan_generation_explanations").insert(explanations);
    const selectionExplanations = (savedItems ?? []).flatMap((item) => {
      const recipeId = item.recipe_id;
      if (!recipeId) return [];
      const categoryMatched = recipeIdsByMealCategory.get(item.meal_category_id)?.has(recipeId) ?? false;
      const dietMatched = Boolean(profile?.diet_type && compatibleDiet.get(recipeId)?.includes(profile.diet_type));
      return [
        { meal_plan_item_id: item.id, generation_run_id: run.id, explanation_code: "quality_score", message: "Selected with its stored recipe quality score.", metadata: { quality_score: qualityByRecipe.get(recipeId) ?? 0 } },
        ...(categoryMatched ? [{ meal_plan_item_id: item.id, generation_run_id: run.id, explanation_code: "meal_category", message: "Matches this meal category.", metadata: { meal_category_id: item.meal_category_id } }] : []),
        ...(dietMatched ? [{ meal_plan_item_id: item.id, generation_run_id: run.id, explanation_code: "diet_match", message: "Matches your selected diet.", metadata: { diet_type: profile?.diet_type } }] : []),
      ];
    });
    if (selectionExplanations.length > 0) await supabase.from("meal_plan_item_selection_explanations").insert(selectionExplanations);
    await supabase.from("weekly_meal_plans").update({ status: "prepared_for_review", latest_generation_run_id: run.id }).eq("id", plan.id);
  }

  revalidatePath("/dashboard/meal-plans");
  return { success: true, message: `Your ${getWeekEnd(parsed.data.week_start_date)} week is prepared for review.` };
}

export async function approveWeeklyPlan(values: ApproveWeeklyPlanInput): Promise<PlanningActionResult> {
  const parsed = approveWeeklyPlanSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: "This weekly plan is invalid." };
  const { supabase, user, householdId } = await getPlanningContext();
  if (!user || !householdId) return { success: false, message: "Your household is not available yet." };
  const { data: plan } = await supabase.from("weekly_meal_plans").select("id, status").eq("id", parsed.data.meal_plan_id).eq("household_id", householdId).maybeSingle();
  if (!plan) return { success: false, message: "This weekly plan is not available." };
  if (!(["prepared_for_review", "approved", "grocery_generated"] as const).includes(plan.status)) {
    return { success: false, message: "Review the prepared week before generating its grocery basket." };
  }
  if (plan.status === "prepared_for_review") {
    const { error } = await supabase.from("weekly_meal_plans").update({ status: "approved", approved_at: new Date().toISOString(), approved_by: user.id }).eq("id", plan.id);
    if (error) return { success: false, message: "We could not approve this weekly plan." };
  }

  const { data: plannedItemsData, error: plannedItemsError } = await supabase.from("weekly_meal_plan_items").select("id, recipe_id, servings").eq("meal_plan_id", plan.id).not("recipe_id", "is", null);
  if (plannedItemsError) return { success: false, message: "Week approved, but we could not load its planned recipes." };
  const plannedItems = (plannedItemsData ?? []) as PlannedRecipeItem[];
  const recipeIds = [...new Set(plannedItems.flatMap((item: PlannedRecipeItem) => item.recipe_id ? [item.recipe_id] : []))];
  const { data: groceryList, error: groceryListError } = await supabase.from("grocery_lists").upsert({ household_id: householdId, weekly_meal_plan_id: plan.id, status: "prepared" }, { onConflict: "weekly_meal_plan_id" }).select("id").single();
  if (groceryListError || !groceryList) return { success: false, message: "Week approved, but we could not prepare the grocery basket." };

  if (recipeIds.length > 0) {
    const [{ data: recipes, error: recipesError }, { data: recipeIngredientsData, error: recipeIngredientsError }, { data: pantryItems, error: pantryItemsError }, { data: existingItems, error: existingItemsError }] = await Promise.all([
      supabase.from("recipes").select("id, servings").in("id", recipeIds),
      supabase.from("recipe_ingredients").select("recipe_id, ingredient_id, base_quantity, base_unit_code").in("recipe_id", recipeIds),
      supabase.from("pantry_items").select("ingredient_id, quantity_base, base_unit_code, expires_at").eq("household_id", householdId),
      supabase.from("grocery_list_items").select("id, ingredient_id, manual_adjustment_quantity_base, is_removed, estimated_unit_cost").eq("grocery_list_id", groceryList.id).eq("is_custom", false),
    ]);
    if (recipesError || recipeIngredientsError || pantryItemsError || existingItemsError) {
      return { success: false, message: "Week approved, but we could not load the data needed for its grocery basket." };
    }
    const recipeIngredients = (recipeIngredientsData ?? []) as RecipeIngredient[];
    const ingredientIds = [...new Set(recipeIngredients.map((item: RecipeIngredient) => item.ingredient_id))];
    const { data: ingredients } = ingredientIds.length > 0
      ? await supabase.from("ingredients").select("id, estimated_unit_cost, cost_currency").in("id", ingredientIds)
      : { data: [] };

    const existingSnapshotItems = await supabase.from("meal_plan_item_recipe_snapshots").select("meal_plan_item_id").in("meal_plan_item_id", plannedItems.map((item: PlannedRecipeItem) => item.id));
    const existingSnapshotIds = new Set((existingSnapshotItems.data ?? []).map((item) => item.meal_plan_item_id));
    const recipeSnapshotById = new Map((recipes ?? []).map((recipe) => [recipe.id, recipe]));
    const ingredientsByRecipe = new Map<string, RecipeIngredient[]>();
    for (const ingredient of recipeIngredients) {
      ingredientsByRecipe.set(ingredient.recipe_id, [...(ingredientsByRecipe.get(ingredient.recipe_id) ?? []), ingredient]);
    }
    const snapshots = plannedItems
      .filter((item: PlannedRecipeItem) => item.recipe_id && !existingSnapshotIds.has(item.id))
      .map((item: PlannedRecipeItem) => ({
        meal_plan_item_id: item.id,
        recipe_snapshot: { recipe: recipeSnapshotById.get(item.recipe_id as string), servings: item.servings } as Json,
        ingredient_snapshot: { ingredients: ingredientsByRecipe.get(item.recipe_id as string) ?? [] } as Json,
      }));
    if (snapshots.length > 0) {
      const { error } = await supabase.from("meal_plan_item_recipe_snapshots").insert(snapshots);
      if (error) return { success: false, message: "Week approved, but we could not save its recipe snapshots." };
    }

    const servingsByRecipe = new Map((recipes ?? []).map((recipe) => [recipe.id, recipe.servings ?? 1]));
    const required = new Map<string, GroceryRequirement>();
    for (const planItem of plannedItems) {
      if (!planItem.recipe_id) continue;
      const factor = (planItem.servings ?? servingsByRecipe.get(planItem.recipe_id) ?? 1) / (servingsByRecipe.get(planItem.recipe_id) ?? 1);
      for (const ingredient of ingredientsByRecipe.get(planItem.recipe_id) ?? []) {
        if (ingredient.base_quantity === null || ingredient.base_unit_code === null) continue;
        const current = required.get(ingredient.ingredient_id) ?? { quantity: 0, unit: ingredient.base_unit_code, sources: [] };
        const quantity = ingredient.base_quantity * factor;
        current.quantity += quantity;
        current.sources.push({ planItemId: planItem.id, recipeId: planItem.recipe_id, quantity });
        required.set(ingredient.ingredient_id, current);
      }
    }
    const pantryByIngredientAndUnit = new Map<string, number>();
    const today = new Date().toISOString().slice(0, 10);
    for (const item of pantryItems ?? []) {
      if (!item.expires_at || item.expires_at >= today) {
        const key = `${item.ingredient_id}:${item.base_unit_code}`;
        pantryByIngredientAndUnit.set(key, (pantryByIngredientAndUnit.get(key) ?? 0) + item.quantity_base);
      }
    }
    const ingredientCost = new Map((ingredients ?? []).map((ingredient) => [ingredient.id, ingredient.estimated_unit_cost]));
    const existingByIngredient = new Map((existingItems ?? []).flatMap((item) => item.ingredient_id ? [[item.ingredient_id, item]] as const : []));
    let total = 0;
    for (const [ingredientId, requirement] of required) {
      const generated = Math.max(0, requirement.quantity - (pantryByIngredientAndUnit.get(`${ingredientId}:${requirement.unit}`) ?? 0));
      const existing = existingByIngredient.get(ingredientId);
      const manualAdjustment = existing?.manual_adjustment_quantity_base ?? 0;
      const effective = Math.max(0, generated + manualAdjustment);
      const unitCost = ingredientCost.get(ingredientId) ?? null;
      const totalCost = unitCost === null ? null : unitCost * effective;
      if (!existing?.is_removed && totalCost !== null) total += totalCost;
      const payload = { generated_quantity_base: generated, effective_quantity_base: effective, base_unit_code: requirement.unit, estimated_unit_cost: unitCost, estimated_total_cost: totalCost };
      const { error } = existing
        ? await supabase.from("grocery_list_items").update(payload).eq("id", existing.id)
        : await supabase.from("grocery_list_items").insert({ grocery_list_id: groceryList.id, ingredient_id: ingredientId, ...payload });
      if (error) return { success: false, message: "Week approved, but we could not save its grocery items." };
    }
    for (const existing of existingItems ?? []) {
      if (!existing.ingredient_id || required.has(existing.ingredient_id)) continue;
      const effective = Math.max(0, existing.manual_adjustment_quantity_base);
      const totalCost = existing.estimated_unit_cost === null ? null : existing.estimated_unit_cost * effective;
      if (!existing.is_removed && totalCost !== null) total += totalCost;
      const { error } = await supabase.from("grocery_list_items").update({ generated_quantity_base: 0, effective_quantity_base: effective, estimated_total_cost: totalCost }).eq("id", existing.id);
      if (error) return { success: false, message: "Week approved, but we could not update its grocery items." };
    }
    const { data: refreshedItems, error: refreshedItemsError } = await supabase.from("grocery_list_items").select("id, ingredient_id").eq("grocery_list_id", groceryList.id).eq("is_custom", false);
    if (refreshedItemsError) return { success: false, message: "Week approved, but we could not refresh grocery items." };
    const refreshedItemIds = (refreshedItems ?? []).map((item) => item.id);
    if (refreshedItemIds.length > 0) {
      const { error } = await supabase.from("grocery_list_item_sources").delete().in("grocery_list_item_id", refreshedItemIds);
      if (error) return { success: false, message: "Week approved, but we could not refresh grocery item sources." };
    }
    const listItemByIngredient = new Map((refreshedItems ?? []).flatMap((item) => item.ingredient_id ? [[item.ingredient_id, item.id]] as const : []));
    const sources = [...required.entries()].flatMap(([ingredientId, requirement]) => requirement.sources.map((source) => ({ grocery_list_item_id: listItemByIngredient.get(ingredientId), weekly_meal_plan_item_id: source.planItemId, recipe_id: source.recipeId, ingredient_id: ingredientId, quantity_base: source.quantity, base_unit_code: requirement.unit }))).filter((source): source is { grocery_list_item_id: string; weekly_meal_plan_item_id: string; recipe_id: string; ingredient_id: string; quantity_base: number; base_unit_code: string } => Boolean(source.grocery_list_item_id));
    if (sources.length > 0) {
      const { error } = await supabase.from("grocery_list_item_sources").insert(sources);
      if (error) return { success: false, message: "Week approved, but we could not save grocery item sources." };
    }
    const { error: groceryListUpdateError } = await supabase.from("grocery_lists").update({ estimated_total: total, currency_code: "INR" }).eq("id", groceryList.id);
    if (groceryListUpdateError) return { success: false, message: "Week approved, but we could not finalize the grocery basket." };
  } else {
    const { data: existingItems } = await supabase.from("grocery_list_items").select("id, manual_adjustment_quantity_base").eq("grocery_list_id", groceryList.id).eq("is_custom", false);
    const ids = (existingItems ?? []).map((item) => item.id);
    if (ids.length > 0) {
      const { error: sourcesError } = await supabase.from("grocery_list_item_sources").delete().in("grocery_list_item_id", ids);
      if (sourcesError) return { success: false, message: "Week approved, but we could not refresh grocery item sources." };
      for (const item of existingItems ?? []) {
        const { error } = await supabase.from("grocery_list_items").update({ generated_quantity_base: 0, effective_quantity_base: Math.max(0, item.manual_adjustment_quantity_base), estimated_total_cost: null }).eq("id", item.id);
        if (error) return { success: false, message: "Week approved, but we could not update its grocery items." };
      }
    }
    const { error } = await supabase.from("grocery_lists").update({ estimated_total: 0, currency_code: "INR" }).eq("id", groceryList.id);
    if (error) return { success: false, message: "Week approved, but we could not finalize the grocery basket." };
  }

  const { error: planUpdateError } = await supabase.from("weekly_meal_plans").update({ status: "grocery_generated" }).eq("id", plan.id);
  if (planUpdateError) return { success: false, message: "The grocery basket is ready, but we could not update the weekly plan." };
  revalidatePath("/dashboard/meal-plans");
  return { success: true, message: "Week approved. Your pantry-adjusted grocery basket is ready." };
}
