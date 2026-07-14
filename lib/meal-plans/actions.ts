"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import { getUpcomingWeekStart, getWeekEnd } from "./constants";
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
    .select("id, week_start_date")
    .eq("id", parsedValues.data.meal_plan_id)
    .eq("household_id", householdId)
    .maybeSingle();

  if (planError || !plan) {
    return { success: false, message: "This weekly plan is no longer available." };
  }

  if (parsedValues.data.meal_date < plan.week_start_date || parsedValues.data.meal_date > getWeekEnd(plan.week_start_date)) {
    return { success: false, message: "Choose a date within this weekly plan." };
  }

  const [{ data: category }, { data: slotType }] = await Promise.all([
    supabase.from("meal_categories").select("id").eq("id", parsedValues.data.meal_category_id).maybeSingle(),
    supabase.from("meal_slot_types").select("requires_recipe").eq("id", parsedValues.data.meal_slot_type_id).maybeSingle(),
  ]);

  if (!category || !slotType) {
    return { success: false, message: "Select an available meal category and slot type." };
  }

  if (slotType.requires_recipe && parsedValues.data.recipe_id === "") {
    return { success: false, message: "Choose a recipe for this meal slot." };
  }

  if (parsedValues.data.recipe_id !== "") {
    const { data: recipe } = await supabase
      .from("recipes")
      .select("id")
      .eq("id", parsedValues.data.recipe_id)
      .maybeSingle();

    if (!recipe) {
      return { success: false, message: "That recipe is not available to your account." };
    }
  }

  const { data: existingItems, error: existingItemsError } = await supabase
    .from("weekly_meal_plan_items")
    .select("slot_index")
    .eq("meal_plan_id", plan.id)
    .eq("meal_date", parsedValues.data.meal_date)
    .eq("meal_category_id", parsedValues.data.meal_category_id)
    .order("slot_index", { ascending: false })
    .limit(1);

  if (existingItemsError) {
    return { success: false, message: "We could not add this meal slot. Please try again." };
  }

  const nextSlotIndex = (existingItems?.[0]?.slot_index ?? -1) + 1;
  const item: WeeklyMealPlanItemInsert = {
    household_id: householdId,
    meal_plan_id: plan.id,
    meal_date: parsedValues.data.meal_date,
    meal_category_id: parsedValues.data.meal_category_id,
    meal_slot_type_id: parsedValues.data.meal_slot_type_id,
    recipe_id: parsedValues.data.recipe_id || null,
    servings: parsedValues.data.servings,
    title: parsedValues.data.title || null,
    notes: parsedValues.data.notes || null,
    slot_index: nextSlotIndex,
  };

  const { error } = await supabase.from("weekly_meal_plan_items").insert(item);

  if (error) {
    return { success: false, message: "We could not add this meal slot. Please try again." };
  }

  revalidatePath("/dashboard/meal-plans");
  return { success: true, message: "Meal slot added to your week." };
}
