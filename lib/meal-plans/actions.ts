"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { approveWeeklyPlan } from "@/lib/planning/actions";

import { getUpcomingWeekStart, getWeekEnd, getWeekStart } from "./constants";
import { addMealPlanItemSchema, createWeeklyMealPlanSchema, type AddMealPlanItemInput, type CreateWeeklyMealPlanInput } from "./schemas";
import type { MealPlanActionResult, WeeklyMealPlanItemInsert } from "./types";

async function getCurrentHouseholdId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, householdId: null };
  }

  const { data, error } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load your household.");
  }

  return { supabase, householdId: data?.household_id ?? null };
}

function getTodayInIndia() {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = new Map(parts.map((part) => [part.type, part.value]));
  return `${values.get("year")}-${values.get("month")}-${values.get("day")}`;
}

export async function createWeeklyMealPlan(values: CreateWeeklyMealPlanInput): Promise<MealPlanActionResult> {
  const parsedValues = createWeeklyMealPlanSchema.safeParse(values);

  if (!parsedValues.success) {
    return { success: false, message: "Choose a valid week before creating a plan." };
  }
  if (parsedValues.data.week_start_date !== getUpcomingWeekStart()) {
    return { success: false, message: "You can only create the upcoming Monday–Saturday plan." };
  }

  const { supabase, householdId } = await getCurrentHouseholdId();

  if (!householdId) {
    return { success: false, message: "Your household is not available yet. Please refresh and try again." };
  }

  const { error } = await supabase
    .from("weekly_meal_plans")
    .upsert(
      { household_id: householdId, week_start_date: parsedValues.data.week_start_date },
      { onConflict: "household_id,week_start_date" },
    );

  if (error) {
    return { success: false, message: "We could not create this weekly plan. Please try again." };
  }

  revalidatePath("/dashboard/meal-plans");
  return { success: true, message: "Your weekly plan is ready." };
}

export async function addMealPlanItem(values: AddMealPlanItemInput): Promise<MealPlanActionResult> {
  const parsedValues = addMealPlanItemSchema.safeParse(values);

  if (!parsedValues.success) {
    return { success: false, message: "Please correct the meal slot details and try again." };
  }

  const { supabase, householdId } = await getCurrentHouseholdId();

  if (!householdId) {
    return { success: false, message: "Your household is not available yet. Please refresh and try again." };
  }

  const { data: plan, error: planError } = await supabase
    .from("weekly_meal_plans")
    .select("id, week_start_date, status")
    .eq("id", parsedValues.data.meal_plan_id)
    .eq("household_id", householdId)
    .maybeSingle();

  if (planError || !plan) {
    return { success: false, message: "This weekly plan is no longer available." };
  }

  const currentWeekStart = getWeekStart();
  const upcomingWeekStart = getUpcomingWeekStart();
  const weekEndDate = getWeekEnd(plan.week_start_date);
  if (plan.week_start_date === currentWeekStart) {
    const today = getTodayInIndia();
    if (parsedValues.data.meal_date < today || parsedValues.data.meal_date > weekEndDate) {
      return { success: false, message: "Choose a date from today through Saturday for this week." };
    }
  } else if (plan.week_start_date === upcomingWeekStart) {
    if (parsedValues.data.meal_date < plan.week_start_date || parsedValues.data.meal_date > weekEndDate) {
      return { success: false, message: "Choose a Monday through Saturday date for next week." };
    }
  } else {
    return { success: false, message: "Manual meals can only be added to the current or next week." };
  }

  const [{ data: category }, { data: recipeSlotType }] = await Promise.all([
    supabase.from("meal_categories").select("id, slug").eq("id", parsedValues.data.meal_category_id).in("slug", ["snacks", "desserts"]).maybeSingle(),
    supabase.from("meal_slot_types").select("id").eq("slug", "recipe").maybeSingle(),
  ]);

  if (!category || !recipeSlotType) {
    return { success: false, message: "Choose Snack or Dessert for an extra recipe meal." };
  }

  const [{ data: recipe }, { data: recipeCategory }] = await Promise.all([
    supabase.from("recipes").select("id").eq("id", parsedValues.data.recipe_id).maybeSingle(),
    supabase.from("recipe_meal_categories").select("recipe_id").eq("recipe_id", parsedValues.data.recipe_id).eq("meal_category_id", category.id).maybeSingle(),
  ]);
  if (!recipe || !recipeCategory) {
    return { success: false, message: `Choose a recipe compatible with ${category.slug === "snacks" ? "Snack" : "Dessert"}.` };
  }

  const { data: existingItems, error: existingItemsError } = await supabase
    .from("weekly_meal_plan_items")
    .select("id")
    .eq("meal_plan_id", plan.id)
    .eq("meal_date", parsedValues.data.meal_date)
    .eq("meal_category_id", parsedValues.data.meal_category_id)
    .limit(1);

  if (existingItemsError) {
    return { success: false, message: "We could not add this meal slot. Please try again." };
  }

  if (existingItems?.length) {
    return { success: false, message: "A meal of this category is already planned for this date." };
  }
  const item: WeeklyMealPlanItemInsert = {
    household_id: householdId,
    meal_plan_id: plan.id,
    meal_date: parsedValues.data.meal_date,
    meal_category_id: parsedValues.data.meal_category_id,
    meal_slot_type_id: recipeSlotType.id,
    recipe_id: parsedValues.data.recipe_id,
    servings: parsedValues.data.servings,
    title: null,
    notes: parsedValues.data.notes || null,
    slot_index: 0,
  };

  const { error } = await supabase.from("weekly_meal_plan_items").insert(item);

  if (error) {
    return { success: false, message: "We could not add this meal slot. Please try again." };
  }

  if (["approved", "grocery_generated"].includes(plan.status)) {
    const groceryResult = await approveWeeklyPlan({ meal_plan_id: plan.id });
    if (!groceryResult.success) {
      return { success: false, message: "Meal added, but we could not update its grocery basket. Please try again." };
    }
    revalidatePath("/dashboard/grocery");
    revalidatePath("/dashboard/meal-plans");
    return { success: true, message: "Meal added. Your grocery basket has been updated." };
  }

  revalidatePath("/dashboard/meal-plans");
  return { success: true, message: "Meal slot added to your week." };
}
