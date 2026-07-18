import { createClient } from "@/lib/supabase/server";

import type {
  Household,
  MealCategory,
  MealPlanningData,
  MealSlotType,
  PlannedMealItem,
  Recipe,
  WeeklyMealPlan,
  WeeklyMealPlanItem,
} from "./types";

async function getCurrentHousehold(): Promise<Household | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: membership, error: membershipError } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    throw new Error("Unable to load your household.");
  }

  if (!membership) {
    return null;
  }

  const { data, error } = await supabase.from("households").select("*").eq("id", membership.household_id).maybeSingle();

  if (error) {
    throw new Error("Unable to load your household.");
  }

  return data as Household | null;
}

export async function getMealPlanningData(weekStartDate: string): Promise<MealPlanningData> {
  const supabase = await createClient();
  const household = await getCurrentHousehold();

  const [{ data: categories, error: categoriesError }, { data: slotTypes, error: slotTypesError }, { data: recipes, error: recipesError }] = await Promise.all([
    supabase.from("meal_categories").select("*").order("display_order"),
    supabase.from("meal_slot_types").select("*").order("display_order"),
    supabase.from("recipes").select("id, name, servings").order("name").limit(100),
  ]);

  if (categoriesError || slotTypesError || recipesError) {
    throw new Error("Unable to load meal planning options.");
  }

  if (!household) {
    return {
      household: null,
      plan: null,
      items: [],
      mealCategories: categories as MealCategory[],
      mealSlotTypes: slotTypes as MealSlotType[],
      recipes: recipes as Pick<Recipe, "id" | "name" | "servings">[],
      recipeMealCategoryIds: {},
    };
  }

  const recipeIds = (recipes ?? []).map((recipe) => recipe.id);
  const { data: recipeMealCategories, error: recipeMealCategoriesError } = recipeIds.length > 0
    ? await supabase.from("recipe_meal_categories").select("recipe_id, meal_category_id").in("recipe_id", recipeIds)
    : { data: [], error: null };
  if (recipeMealCategoriesError) {
    throw new Error("Unable to load recipe meal categories.");
  }
  const recipeMealCategoryIds = (recipeMealCategories ?? []).reduce<Record<string, string[]>>((assignments, assignment) => ({
    ...assignments,
    [assignment.recipe_id]: [...(assignments[assignment.recipe_id] ?? []), assignment.meal_category_id],
  }), {});

  const { data: plan, error: planError } = await supabase
    .from("weekly_meal_plans")
    .select("*")
    .eq("household_id", household.id)
    .eq("week_start_date", weekStartDate)
    .maybeSingle();

  if (planError) {
    throw new Error("Unable to load this weekly meal plan.");
  }

  if (!plan) {
    return {
      household,
      plan: null,
      items: [],
      mealCategories: categories as MealCategory[],
      mealSlotTypes: slotTypes as MealSlotType[],
      recipes: recipes as Pick<Recipe, "id" | "name" | "servings">[],
      recipeMealCategoryIds,
    };
  }

  const { data: items, error: itemsError } = await supabase
    .from("weekly_meal_plan_items")
    .select("*")
    .eq("meal_plan_id", plan.id)
    .order("meal_date")
    .order("slot_index");

  if (itemsError) {
    throw new Error("Unable to load this plan's meal slots.");
  }

  const categoryNames = new Map((categories as MealCategory[]).map((category) => [category.id, category.name]));
  const slotTypeNames = new Map((slotTypes as MealSlotType[]).map((slotType) => [slotType.id, slotType.name]));
  const recipeNames = new Map((recipes as Pick<Recipe, "id" | "name" | "servings">[]).map((recipe) => [recipe.id, recipe.name]));
  const plannedItems = (items as WeeklyMealPlanItem[]).map<PlannedMealItem>((item) => ({
    ...item,
    meal_category_name: categoryNames.get(item.meal_category_id) ?? "Meal",
    meal_slot_type_name: slotTypeNames.get(item.meal_slot_type_id) ?? "Meal slot",
    recipe_name: item.recipe_id ? recipeNames.get(item.recipe_id) ?? null : null,
  }));

  return {
    household,
    plan: plan as WeeklyMealPlan,
    items: plannedItems,
    mealCategories: categories as MealCategory[],
    mealSlotTypes: slotTypes as MealSlotType[],
    recipes: recipes as Pick<Recipe, "id" | "name" | "servings">[],
    recipeMealCategoryIds,
  };
}
