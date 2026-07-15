export const WEEKLY_PREFERENCE_VALUES = [
  "healthy_balanced",
  "high_protein",
  "weight_loss",
  "diabetic_friendly",
  "kids_friendly",
  "south_indian",
  "north_indian",
  "mixed_indian",
  "budget_friendly",
  "quick_meals",
  "home_style",
  "cheat_week",
] as const;

export type WeeklyPreference = (typeof WEEKLY_PREFERENCE_VALUES)[number];

export const DEFAULT_WEEKLY_PREFERENCE: WeeklyPreference = "healthy_balanced";

export const WEEKLY_PREFERENCES: Record<WeeklyPreference, { label: string; description: string; budget: string }> = {
  healthy_balanced: { label: "🌿 Healthy Balanced", description: "Balanced nutrition with good meal variety.", budget: "₹900–₹1200" },
  high_protein: { label: "💪 High Protein", description: "Prioritize protein-rich meals.", budget: "₹1100–₹1500" },
  weight_loss: { label: "⚖️ Weight Loss", description: "Prefer lower calorie meals with high satiety.", budget: "₹900–₹1200" },
  diabetic_friendly: { label: "🩺 Diabetic Friendly", description: "Prefer steady-energy meals with sensible portions.", budget: "₹900–₹1200" },
  kids_friendly: { label: "👶 Kids Friendly", description: "Favor familiar, family-friendly meals with variety.", budget: "₹900–₹1200" },
  south_indian: { label: "🥥 South Indian", description: "Strong preference for South Indian cuisine.", budget: "₹800–₹1100" },
  north_indian: { label: "🫓 North Indian", description: "Strong preference for North Indian cuisine.", budget: "₹900–₹1300" },
  mixed_indian: { label: "🇮🇳 Mixed Indian", description: "Balanced mix of Indian cuisines.", budget: "₹900–₹1200" },
  budget_friendly: { label: "💰 Budget Friendly", description: "Prefer economical meals while maintaining variety.", budget: "₹700–₹900" },
  quick_meals: { label: "⏱ Quick Meals", description: "Prefer recipes requiring less cooking time.", budget: "₹900–₹1200" },
  home_style: { label: "🍛 Home Style", description: "Favor comforting everyday meals made from familiar ingredients.", budget: "₹800–₹1100" },
  cheat_week: { label: "🍕 Cheat Week", description: "Mostly healthy meals with one or two indulgent meals.", budget: "₹1200–₹1700" },
};
