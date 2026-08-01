import { getMealPlanningData, getWeekStart } from "@/lib/meal-plans";
import { getGrocerySnapshotCounts } from "@/lib/grocery/snapshot";
import { getCurrentUserProfile } from "@/lib/profile/queries";
import { createClient } from "@/lib/supabase/server";

function getTodayInIndia() {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = new Map(parts.map((part) => [part.type, part.value]));
  return `${values.get("year")}-${values.get("month")}-${values.get("day")}`;
}

export async function getDashboardData() {
  const weekStartDate = getWeekStart();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [profile, mealPlanning] = await Promise.all([getCurrentUserProfile(), getMealPlanningData(weekStartDate)]);
  const householdId = mealPlanning.household?.id;
  const todayMeals = mealPlanning.items.filter((item) => item.meal_date === getTodayInIndia());

  if (!householdId) return { profile, email: user?.email ?? null, weekStartDate, plan: null, todayMeals, pantryItemCount: 0, grocery: null, recentlyCooked: [] };
  const [grocery, { count: pantryItemCount, error: pantryError }, { data: purchasedPlans, error: purchasedPlansError }] = await Promise.all([
    mealPlanning.plan ? getGrocerySnapshotCounts(householdId, mealPlanning.plan.id, mealPlanning.plan.status) : Promise.resolve(null),
    supabase.from("pantry_items").select("id", { count: "exact", head: true }).eq("household_id", householdId).eq("available", true),
    supabase.from("weekly_meal_plans").select("id").eq("household_id", householdId).eq("status", "purchased").order("week_start_date", { ascending: false }).limit(4),
  ]);
  if (pantryError || purchasedPlansError) throw new Error("Unable to load your dashboard summary.");

  const purchasedPlanIds = (purchasedPlans ?? []).map((plan) => plan.id);
  const { data: cookedItems, error: cookedItemsError } = purchasedPlanIds.length
    ? await supabase.from("weekly_meal_plan_items").select("recipe_id, meal_date, slot_index").in("meal_plan_id", purchasedPlanIds).not("recipe_id", "is", null).order("meal_date", { ascending: false }).order("slot_index", { ascending: false }).limit(4)
    : { data: [], error: null };
  if (cookedItemsError) throw new Error("Unable to load recently cooked meals.");
  const recipeIds = [...new Set((cookedItems ?? []).flatMap((item) => item.recipe_id ? [item.recipe_id] : []))];
  const { data: cookedRecipes, error: cookedRecipesError } = recipeIds.length
    ? await supabase.from("recipes").select("id, name, cover_image_path").in("id", recipeIds)
    : { data: [], error: null };
  if (cookedRecipesError) throw new Error("Unable to load recently cooked recipes.");
  const recipesById = new Map((cookedRecipes ?? []).map((recipe) => [recipe.id, recipe]));

  return {
    profile,
    email: user?.email ?? null,
    weekStartDate,
    plan: mealPlanning.plan,
    todayMeals,
    pantryItemCount: pantryItemCount ?? 0,
    grocery,
    recentlyCooked: (cookedItems ?? []).flatMap((item) => item.recipe_id && recipesById.get(item.recipe_id) ? [{ ...recipesById.get(item.recipe_id)!, mealDate: item.meal_date }] : []),
  };
}
