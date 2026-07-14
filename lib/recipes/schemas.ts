import { z } from "zod";

const optionalNumber = z.number().nonnegative().nullable();

export const recipeIngredientSchema = z.object({
  ingredient_id: z.string().uuid("Choose a catalog ingredient."),
  quantity: z.number().positive("Quantity must be greater than zero."),
  unit_code: z.string().trim().min(1).max(24),
  base_quantity: optionalNumber,
  base_unit_code: z.string().trim().max(24).nullable(),
  is_optional: z.boolean(),
  preparation_note: z.string().trim().max(160).nullable(),
}).refine((value) => (value.base_quantity === null) === (value.base_unit_code === null), { message: "Base quantity and base unit must be supplied together.", path: ["base_unit_code"] });

export const recipeStepSchema = z.object({
  instruction: z.string().trim().min(3, "Add a clear cooking instruction.").max(1000),
  estimated_duration_minutes: optionalNumber,
  tip: z.string().trim().max(500).nullable(),
});

export const recipeFormSchema = z.object({
  name: z.string().trim().min(2, "Recipe name is required.").max(120),
  description: z.string().trim().max(1000).nullable(),
  primary_cuisine_id: z.string().uuid().nullable(),
  primary_cuisine_region_id: z.string().uuid().nullable(),
  meal_category_ids: z.array(z.string().uuid()).min(1, "Choose at least one meal category."),
  tag_ids: z.array(z.string().uuid()),
  equipment_ids: z.array(z.string().uuid()),
  servings: z.number().positive().nullable(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).nullable(),
  prep_time_minutes: optionalNumber,
  cook_time_minutes: optionalNumber,
  calories_kcal: optionalNumber,
  protein_g: optionalNumber,
  carbohydrates_g: optionalNumber,
  fat_g: optionalNumber,
  fiber_g: optionalNumber,
  sugar_g: optionalNumber,
  sodium_mg: optionalNumber,
  ingredients: z.array(recipeIngredientSchema).min(1, "Add at least one ingredient."),
  steps: z.array(recipeStepSchema).min(1, "Add at least one cooking step."),
});

export type RecipeFormInput = z.infer<typeof recipeFormSchema>;
