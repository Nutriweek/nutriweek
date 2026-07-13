import { z } from "zod";

import {
  ACTIVITY_LEVEL_VALUES,
  ALLERGY_OPTIONS,
  CUISINE_PREFERENCE_OPTIONS,
  DIET_TYPE_VALUES,
  GENDER_VALUES,
  HEALTH_GOAL_VALUES,
  KITCHEN_EQUIPMENT_OPTIONS,
} from "./constants";

const optionalText = z.string().trim().max(120).or(z.literal(""));
const optionalDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.").or(z.literal(""));
const optionalPositiveNumber = z.number().finite().positive("Enter a value greater than zero.").nullable();
const optionalNonNegativeNumber = z.number().finite().nonnegative("Enter a non-negative value.").nullable();

export const profileSchema = z
  .object({
    full_name: optionalText,
    date_of_birth: optionalDate,
    gender: z.enum(GENDER_VALUES).or(z.literal("")),
    height_cm: optionalPositiveNumber,
    weight_kg: optionalPositiveNumber,
    activity_level: z.enum(ACTIVITY_LEVEL_VALUES).or(z.literal("")),
    health_goal: z.enum(HEALTH_GOAL_VALUES).or(z.literal("")),
    diet_type: z.enum(DIET_TYPE_VALUES).or(z.literal("")),
    allergies: z.array(z.enum(ALLERGY_OPTIONS)),
    cuisine_preferences: z.array(z.enum(CUISINE_PREFERENCE_OPTIONS)),
    meals_per_day: optionalPositiveNumber,
    family_size: optionalPositiveNumber,
    weekly_grocery_budget: optionalNonNegativeNumber,
    currency_code: z.string().trim().length(3, "Use a three-character currency code.").or(z.literal("")),
    country: optionalText,
    state_province: optionalText,
    city: optionalText,
    kitchen_equipment: z.array(z.enum(KITCHEN_EQUIPMENT_OPTIONS)),
  })
  .refine(
    ({ weekly_grocery_budget, currency_code }) =>
      (weekly_grocery_budget === null && currency_code === "") ||
      (weekly_grocery_budget !== null && currency_code.length === 3),
    { message: "Provide both a weekly budget and currency code.", path: ["weekly_grocery_budget"] },
  );

export type ProfileFormValues = z.infer<typeof profileSchema>;
