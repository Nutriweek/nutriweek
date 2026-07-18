import type { Tables, TablesInsert } from "@/lib/supabase/database.types";

export type Household = Tables<"households">;
export type MealCategory = Tables<"meal_categories">;
export type MealSlotType = Tables<"meal_slot_types">;
export type Recipe = Tables<"recipes">;
export type WeeklyMealPlan = Tables<"weekly_meal_plans">;
export type WeeklyMealPlanItem = Tables<"weekly_meal_plan_items">;
export type WeeklyMealPlanItemInsert = TablesInsert<"weekly_meal_plan_items">;

export type PlannedMealItem = WeeklyMealPlanItem & {
  meal_category_name: string;
  meal_slot_type_name: string;
  recipe_name: string | null;
};

export type MealPlanningData = {
  household: Household | null;
  plan: WeeklyMealPlan | null;
  items: PlannedMealItem[];
  mealCategories: MealCategory[];
  mealSlotTypes: MealSlotType[];
  recipes: Pick<Recipe, "id" | "name" | "servings">[];
  recipeMealCategoryIds: Record<string, string[]>;
};

export type MealPlanActionResult =
  | { success: true; message: string }
  | { success: false; message: string };
