import type { Tables } from "@/lib/supabase/database.types";

export type PlanningRecipe = Pick<Tables<"recipes">, "id" | "name" | "servings" | "calories_kcal" | "prep_time_minutes" | "cook_time_minutes" | "source_type">;
export type PlanningExplanation = Tables<"meal_plan_generation_explanations">;

export type PlanningActionResult =
  | { success: true; message: string }
  | { success: false; message: string };
