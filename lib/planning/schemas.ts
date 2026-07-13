import { z } from "zod";

export const prepareWeeklyPlanSchema = z.object({ week_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });
export const approveWeeklyPlanSchema = z.object({ meal_plan_id: z.string().uuid() });

export type PrepareWeeklyPlanInput = z.infer<typeof prepareWeeklyPlanSchema>;
export type ApproveWeeklyPlanInput = z.infer<typeof approveWeeklyPlanSchema>;
