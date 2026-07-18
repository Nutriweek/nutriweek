"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { approveWeeklyPlan } from "@/lib/planning/actions";

import { getUpcomingWeekStart, getWeekEnd, getWeekStart } from "./constants";
import { addMealPlanItemSchema, createWeeklyMealPlanSchema, deleteMealPlanItemSchema, type AddMealPlanItemInput, type CreateWeeklyMealPlanInput, type DeleteMealPlanItemInput } from "./schemas";
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
    supabase.from("meal_categories").select("id, slug, name").eq("id", parsedValues.data.meal_category_id).in("slug", ["breakfast", "lunch", "dinner", "snacks", "desserts"]).maybeSingle(),
    supabase.from("meal_slot_types").select("id").eq("slug", "recipe").maybeSingle(),
  ]);

  if (!category || !recipeSlotType) {
    return { success: false, message: "Choose a supported meal category for this recipe meal." };
  }

  const [{ data: recipe }, { data: recipeCategory }] = await Promise.all([
    supabase.from("recipes").select("id").eq("id", parsedValues.data.recipe_id).maybeSingle(),
    supabase.from("recipe_meal_categories").select("recipe_id").eq("recipe_id", parsedValues.data.recipe_id).eq("meal_category_id", category.id).maybeSingle(),
  ]);
  if (!recipe || !recipeCategory) {
    return { success: false, message: `Choose a recipe compatible with ${category.name}.` };
  }

  const { data: existingItems, error: existingItemsError } = await supabase
    .from("weekly_meal_plan_items")
    .select("id, recipe_id, slot_index")
    .eq("meal_plan_id", plan.id)
    .eq("meal_date", parsedValues.data.meal_date)
    .eq("meal_category_id", parsedValues.data.meal_category_id);

  if (existingItemsError) {
    return { success: false, message: "We could not add this meal slot. Please try again." };
  }

  if (["breakfast", "lunch", "dinner"].includes(category.slug) && (existingItems?.length ?? 0) > 0) {
    return { success: false, message: `A ${category.name.toLowerCase()} is already planned for this date.` };
  }

  const duplicateItem = existingItems?.find((item) => item.recipe_id === parsedValues.data.recipe_id);
  if (duplicateItem) {
    // A source-rebuild failure from an earlier request can leave an otherwise
    // valid manual item without sources. Once the database policy fix is in
    // place, retrying the exact request repairs that state instead of creating
    // a second slot.
    if (["approved", "grocery_generated"].includes(plan.status)) {
      const [{ count: recipeIngredientCount, error: recipeIngredientError }, { count: sourceCount, error: sourceCountError }] = await Promise.all([
        supabase.from("recipe_ingredients").select("ingredient_id", { count: "exact", head: true }).eq("recipe_id", parsedValues.data.recipe_id),
        supabase.from("grocery_list_item_sources").select("grocery_list_item_id", { count: "exact", head: true }).eq("weekly_meal_plan_item_id", duplicateItem.id),
      ]);
      if (recipeIngredientError || sourceCountError) {
        return { success: false, message: "We could not check this meal slot's grocery basket. Please try again." };
      }
      if ((recipeIngredientCount ?? 0) > 0 && (sourceCount ?? 0) === 0) {
        const groceryResult = await approveWeeklyPlan({ meal_plan_id: plan.id });
        if (groceryResult.success) {
          revalidatePath("/dashboard/grocery");
          revalidatePath("/dashboard/meal-plans");
          return { success: true, message: "Meal already exists. Your grocery basket has been updated." };
        }
        return { success: false, message: "This meal already exists, but we could not update its grocery basket. Please try again." };
      }
    }
    return { success: false, message: "This recipe is already planned for this meal category and date." };
  }
  const nextSlotIndex = Math.max(-1, ...(existingItems ?? []).map((item) => item.slot_index)) + 1;
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
    slot_index: nextSlotIndex,
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

export async function deleteMealPlanItem(values: DeleteMealPlanItemInput): Promise<MealPlanActionResult> {
  const parsedValues = deleteMealPlanItemSchema.safeParse(values);
  if (!parsedValues.success) return { success: false, message: "This meal is no longer available." };

  const { supabase, householdId } = await getCurrentHouseholdId();
  if (!householdId) return { success: false, message: "Your household is not available yet. Please refresh and try again." };

  const { data: plan, error: planError } = await supabase.from("weekly_meal_plans").select("id, status").eq("id", parsedValues.data.meal_plan_id).eq("household_id", householdId).maybeSingle();
  if (planError || !plan) return { success: false, message: "This weekly plan is no longer available." };

  const { data: mealItem, error: mealItemError } = await supabase.from("weekly_meal_plan_items").select("id").eq("id", parsedValues.data.meal_plan_item_id).eq("meal_plan_id", plan.id).eq("household_id", householdId).maybeSingle();
  if (mealItemError || !mealItem) return { success: false, message: "This meal is no longer available." };

  const { error: sourceDeleteError } = await supabase.from("grocery_list_item_sources").delete().eq("weekly_meal_plan_item_id", mealItem.id);
  if (sourceDeleteError) return { success: false, message: "We could not remove this meal's grocery sources. Please try again." };

  const { error: deleteError } = await supabase.from("weekly_meal_plan_items").delete().eq("id", mealItem.id).eq("meal_plan_id", plan.id);
  if (deleteError) return { success: false, message: "We could not remove this meal. Please try again." };

  if (["approved", "grocery_generated"].includes(plan.status)) {
    let groceryResult = await approveWeeklyPlan({ meal_plan_id: plan.id });
    if (!groceryResult.success) groceryResult = await approveWeeklyPlan({ meal_plan_id: plan.id });
    if (!groceryResult.success) {
      revalidatePath("/dashboard/meal-plans");
      return { success: false, message: "Meal removed, but we could not update its grocery basket. Please try again." };
    }
    revalidatePath("/dashboard/grocery");
    revalidatePath("/dashboard/meal-plans");
    return { success: true, message: "Meal removed. Grocery basket updated." };
  }

  revalidatePath("/dashboard/meal-plans");
  return { success: true, message: "Meal removed." };
}
