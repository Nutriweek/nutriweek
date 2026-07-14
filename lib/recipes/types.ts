import type { Tables, TablesInsert } from "@/lib/supabase/database.types";

export type Recipe = Tables<"recipes">;
export type Ingredient = Tables<"ingredients">;
export type MealCategory = Tables<"meal_categories">;
export type Cuisine = Tables<"cuisines">;
export type Equipment = Tables<"equipment">;
export type RecipeTag = Tables<"recipe_tags">;

export type RecipeCatalogItem = Pick<Recipe, "id" | "name" | "description" | "servings" | "total_time_minutes" | "difficulty" | "estimated_cost" | "estimated_cost_currency" | "cover_image_path"> & {
  qualityScore: number;
  tags: Pick<RecipeTag, "id" | "name" | "slug">[];
};

export type RecipeIngredientInput = Pick<TablesInsert<"recipe_ingredients">, "ingredient_id" | "quantity" | "unit_code" | "base_quantity" | "base_unit_code" | "is_optional" | "preparation_note">;
export type RecipeStepInput = Pick<TablesInsert<"recipe_steps">, "instruction" | "estimated_duration_minutes" | "tip">;
export type RecipeActionResult =
  | { success: true; message: string; recipeId: string }
  | { success: false; message: string };
