import { z } from "zod";

import { DEFAULT_WEEKLY_PREFERENCE, WEEKLY_PREFERENCE_VALUES } from "./weekly-preferences";

const mealSlotSchema = z.object({
  meal_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  meal_category_slug: z.enum(["breakfast", "lunch", "dinner"]),
});

export const prepareWeeklyPlanSchema = z.object({
  week_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weekly_preference: z.enum(WEEKLY_PREFERENCE_VALUES).default(DEFAULT_WEEKLY_PREFERENCE),
  selected_meal_slots: z.array(mealSlotSchema).min(1),
});
export const approveWeeklyPlanSchema = z.object({ meal_plan_id: z.string().uuid() });

export type PrepareWeeklyPlanInput = z.infer<typeof prepareWeeklyPlanSchema>;
export type ApproveWeeklyPlanInput = z.infer<typeof approveWeeklyPlanSchema>;
