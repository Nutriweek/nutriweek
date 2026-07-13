"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import { profileSchema, type ProfileFormValues } from "./schemas";
import type { ProfileActionResult, ProfileUpdate } from "./types";

export async function updateProfile(values: ProfileFormValues): Promise<ProfileActionResult> {
  const parsedValues = profileSchema.safeParse(values);

  if (!parsedValues.success) {
    return { success: false, message: "Please correct the highlighted fields and try again." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Your session has expired. Please sign in again." };
  }

  const profileUpdate: ProfileUpdate = {
    full_name: parsedValues.data.full_name || null,
    date_of_birth: parsedValues.data.date_of_birth || null,
    gender: parsedValues.data.gender || null,
    height_cm: parsedValues.data.height_cm,
    weight_kg: parsedValues.data.weight_kg,
    activity_level: parsedValues.data.activity_level || null,
    health_goal: parsedValues.data.health_goal || null,
    diet_type: parsedValues.data.diet_type || null,
    allergies: parsedValues.data.allergies,
    cuisine_preferences: parsedValues.data.cuisine_preferences,
    meals_per_day: parsedValues.data.meals_per_day,
    family_size: parsedValues.data.family_size,
    weekly_grocery_budget: parsedValues.data.weekly_grocery_budget,
    currency_code: parsedValues.data.currency_code || null,
    country: parsedValues.data.country || null,
    state_province: parsedValues.data.state_province || null,
    city: parsedValues.data.city || null,
    kitchen_equipment: parsedValues.data.kitchen_equipment,
  };

  const { error } = await supabase.from("profiles").update(profileUpdate).eq("id", user.id);

  if (error) {
    return { success: false, message: "We could not save your profile. Please try again." };
  }

  revalidatePath("/dashboard/profile");
  return { success: true, message: "Your profile has been saved." };
}
