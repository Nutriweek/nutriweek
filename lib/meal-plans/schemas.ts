import { z } from "zod";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date.");
const optionalText = z.string().trim().max(240).or(z.literal(""));

export const createWeeklyMealPlanSchema = z.object({ week_start_date: dateSchema });

export const addMealPlanItemSchema = z.object({
  meal_plan_id: z.string().uuid(),
  meal_date: dateSchema,
  meal_category_id: z.string().uuid(),
  meal_slot_type_id: z.string().uuid(),
  recipe_id: z.string().uuid().or(z.literal("")),
  servings: z.number().finite().positive("Enter a value greater than zero.").nullable(),
  title: optionalText,
  notes: optionalText,
});

export type CreateWeeklyMealPlanInput = z.infer<typeof createWeeklyMealPlanSchema>;
export type AddMealPlanItemInput = z.infer<typeof addMealPlanItemSchema>;
