export const FOOD_PREFERENCE_VALUES = ["vegetarian", "non_vegetarian"] as const;

export type FoodPreference = (typeof FOOD_PREFERENCE_VALUES)[number];

export const DEFAULT_FOOD_PREFERENCE: FoodPreference = "non_vegetarian";

export const FOOD_PREFERENCES: Record<FoodPreference, { label: string; description: string }> = {
  vegetarian: { label: "🥬 Vegetarian", description: "Vegetarian meals only" },
  non_vegetarian: { label: "🍗 Non-Vegetarian", description: "Vegetarian + non-vegetarian meals" },
};
