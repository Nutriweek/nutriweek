import type { PlanningRecipe } from "./types";
import type { WeeklyPreference } from "./weekly-preferences";

type PreferenceScoreInput = {
  recipe: PlanningRecipe;
  qualityScore: number;
  ingredientSlugs: string[];
  tagSlugs: string[];
  cuisineRegionSlug: string | null;
};

const proteinIngredients = new Set(["moong-dal", "toor-dal", "rajma", "whole-chickpeas", "paneer", "chicken", "fish", "egg"]);
const refinedCarbohydrates = new Set(["rice", "basmati-rice", "semolina", "all-purpose-flour"]);
const mildSpices = new Set(["red-chilli-powder", "green-chilli", "kashmiri-chilli-powder"]);

function includesAny(values: string[], targets: Set<string>) {
  return values.some((value) => targets.has(value));
}

function nameMatches(recipe: PlanningRecipe, expression: RegExp) {
  return expression.test(recipe.name.toLowerCase());
}

export function getPreferenceScore(preference: WeeklyPreference, input: PreferenceScoreInput) {
  const { recipe, qualityScore, ingredientSlugs, tagSlugs, cuisineRegionSlug } = input;
  const protein = Number(recipe.protein_g ?? 0);
  const fibre = Number(recipe.fiber_g ?? 0);
  const calories = Number(recipe.calories_kcal ?? 0);
  const fat = Number(recipe.fat_g ?? 0);
  const sugar = Number(recipe.sugar_g ?? 0);
  const totalMinutes = Number(recipe.prep_time_minutes ?? 0) + Number(recipe.cook_time_minutes ?? 0);
  const cost = Number(recipe.estimated_cost ?? 0);
  const hasProteinIngredient = includesAny(ingredientSlugs, proteinIngredients);
  const hasRefinedCarbohydrate = includesAny(ingredientSlugs, refinedCarbohydrates);
  const hasMildSpice = !includesAny(ingredientSlugs, mildSpices);

  switch (preference) {
    case "healthy_balanced": return qualityScore * 0.15 + protein * 0.5 + fibre * 1.2 - sugar * 0.25 - fat * 0.15;
    case "high_protein": return protein * 2 + (hasProteinIngredient ? 12 : -8) + fibre * 0.4;
    case "weight_loss": return protein * 0.8 + fibre * 1.5 - calories * 0.08 - fat * 0.5;
    case "diabetic_friendly": return fibre * 1.8 - sugar * 1.5 - (hasRefinedCarbohydrate ? 10 : 0) + protein * 0.35;
    case "kids_friendly": return qualityScore * 0.2 + (ingredientSlugs.length <= 5 ? 8 : 0) + (hasMildSpice ? 6 : -5);
    case "south_indian": return cuisineRegionSlug === "south-indian" || nameMatches(recipe, /idli|dosa|upma|sambar|poha|rasam/) ? 28 : 0;
    case "north_indian": return cuisineRegionSlug === "north-indian" || nameMatches(recipe, /paratha|rajma|chole|paneer|dal tadka|biryani/) ? 28 : 0;
    case "mixed_indian": return 0;
    case "budget_friendly": return cost > 0 ? Math.max(-10, 30 - cost) : 0;
    case "quick_meals": return totalMinutes > 0 ? Math.max(-10, 35 - totalMinutes * 0.7) : 0;
    case "home_style": return tagSlugs.some((tag) => ["home-style", "traditional", "family"].includes(tag)) || nameMatches(recipe, /curry|dal|sambar|bharta|tadka/) ? 18 : 0;
    case "cheat_week": return isIndulgentRecipe(input) ? 22 : qualityScore * 0.1 + fibre * 0.6 + protein * 0.25;
  }
}

export function isIndulgentRecipe(input: Pick<PreferenceScoreInput, "recipe" | "tagSlugs">) {
  return input.tagSlugs.some((tag) => ["indulgent", "cheat-meal", "treat"].includes(tag)) || nameMatches(input.recipe, /biryani|paratha|masala dosa/);
}
