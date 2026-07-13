export const GENDER_VALUES = ["female", "male", "non_binary", "other", "prefer_not_to_say"] as const;

export const GENDER_OPTIONS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "non_binary", label: "Non-binary" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export const ACTIVITY_LEVEL_VALUES = ["sedentary", "lightly_active", "moderately_active", "very_active"] as const;

export const ACTIVITY_LEVEL_OPTIONS = [
  { value: "sedentary", label: "Sedentary" },
  { value: "lightly_active", label: "Lightly active" },
  { value: "moderately_active", label: "Moderately active" },
  { value: "very_active", label: "Very active" },
] as const;

export const HEALTH_GOAL_VALUES = ["lose_weight", "maintain_weight", "gain_muscle"] as const;

export const HEALTH_GOAL_OPTIONS = [
  { value: "lose_weight", label: "Lose weight" },
  { value: "maintain_weight", label: "Maintain weight" },
  { value: "gain_muscle", label: "Gain muscle" },
] as const;

export const DIET_TYPE_VALUES = ["omnivore", "vegetarian", "vegan", "pescatarian", "keto", "paleo", "halal"] as const;

export const DIET_TYPE_OPTIONS = [
  { value: "omnivore", label: "Omnivore" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "keto", label: "Keto" },
  { value: "paleo", label: "Paleo" },
  { value: "halal", label: "Halal" },
] as const;

export const ALLERGY_OPTIONS = ["Dairy", "Eggs", "Fish", "Gluten", "Peanuts", "Shellfish", "Soy", "Tree nuts"] as const;

export const CUISINE_PREFERENCE_OPTIONS = [
  "Indian",
  "Italian",
  "Mediterranean",
  "Mexican",
  "Thai",
  "Japanese",
] as const;

export const KITCHEN_EQUIPMENT_OPTIONS = [
  "Oven",
  "Microwave",
  "Air Fryer",
  "Pressure Cooker",
  "Mixer",
  "Induction Stove",
] as const;

function includesValue<T extends readonly string[]>(values: T, value: string): value is T[number] {
  return values.includes(value);
}

export function isDietType(value: string): value is (typeof DIET_TYPE_VALUES)[number] {
  return includesValue(DIET_TYPE_VALUES, value);
}

export function isAllergy(value: string): value is (typeof ALLERGY_OPTIONS)[number] {
  return includesValue(ALLERGY_OPTIONS, value);
}

export function isCuisinePreference(value: string): value is (typeof CUISINE_PREFERENCE_OPTIONS)[number] {
  return includesValue(CUISINE_PREFERENCE_OPTIONS, value);
}

export function isKitchenEquipment(value: string): value is (typeof KITCHEN_EQUIPMENT_OPTIONS)[number] {
  return includesValue(KITCHEN_EQUIPMENT_OPTIONS, value);
}
