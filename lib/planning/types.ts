import type { Tables } from "@/lib/supabase/database.types";

export type PlanningRecipe = Pick<Tables<"recipes">, "id" | "name" | "servings" | "calories_kcal" | "protein_g" | "fiber_g" | "sugar_g" | "fat_g" | "prep_time_minutes" | "cook_time_minutes" | "estimated_cost" | "primary_cuisine_region_id" | "source_type">;
export type PlanningExplanation = Tables<"meal_plan_generation_explanations">;

export type PlanningActionResult =
  | { success: true; message: string }
  | { success: false; message: string };
