export type Nutrition = {
  calories_kcal: number | null;
  protein_g: number | null;
  carbohydrates_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  sugar_g: number | null;
  sodium_mg: number | null;
};

export type NutritionTotals = {
  [K in keyof Nutrition]: number;
};

export const EMPTY_NUTRITION: NutritionTotals = {
  calories_kcal: 0,
  protein_g: 0,
  carbohydrates_g: 0,
  fat_g: 0,
  fiber_g: 0,
  sugar_g: 0,
  sodium_mg: 0,
};

export const nutritionMetrics = [
  ["Calories", "calories_kcal", "kcal"],
  ["Protein", "protein_g", "g"],
  ["Carbs", "carbohydrates_g", "g"],
  ["Fat", "fat_g", "g"],
  ["Fiber", "fiber_g", "g"],
  ["Sugar", "sugar_g", "g"],
  ["Sodium", "sodium_mg", "mg"],
] as const satisfies readonly [string, keyof Nutrition, string][];

function numberOrZero(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function formatNutrition(value: number, unit: string) {
  const formatted = Number.isInteger(value)
    ? String(value)
    : value.toFixed(1).replace(/\.0$/, "");
  return `${formatted} ${unit}`;
}

export function toNutritionTotals(
  nutrition: Nutrition | null | undefined,
): NutritionTotals {
  return {
    calories_kcal: numberOrZero(nutrition?.calories_kcal),
    protein_g: numberOrZero(nutrition?.protein_g),
    carbohydrates_g: numberOrZero(nutrition?.carbohydrates_g),
    fat_g: numberOrZero(nutrition?.fat_g),
    fiber_g: numberOrZero(nutrition?.fiber_g),
    sugar_g: numberOrZero(nutrition?.sugar_g),
    sodium_mg: numberOrZero(nutrition?.sodium_mg),
  };
}

export function sumNutrition(
  items: Array<Nutrition | null | undefined>,
): NutritionTotals {
  return items.reduce<NutritionTotals>((totals, item) => {
    const nutrition = toNutritionTotals(item);
    return {
      calories_kcal: totals.calories_kcal + nutrition.calories_kcal,
      protein_g: totals.protein_g + nutrition.protein_g,
      carbohydrates_g: totals.carbohydrates_g + nutrition.carbohydrates_g,
      fat_g: totals.fat_g + nutrition.fat_g,
      fiber_g: totals.fiber_g + nutrition.fiber_g,
      sugar_g: totals.sugar_g + nutrition.sugar_g,
      sodium_mg: totals.sodium_mg + nutrition.sodium_mg,
    };
  }, EMPTY_NUTRITION);
}

export function averageNutrition(
  total: NutritionTotals,
  days: number,
): NutritionTotals {
  if (!days) return EMPTY_NUTRITION;
  return Object.fromEntries(
    Object.entries(total).map(([key, value]) => [key, value / days]),
  ) as NutritionTotals;
}

export function groupNutritionByDay<
  T extends Nutrition & { meal_date: string },
>(items: T[]) {
  return items.reduce<Record<string, NutritionTotals>>(
    (days, item) => ({
      ...days,
      [item.meal_date]: sumNutrition([days[item.meal_date], item]),
    }),
    {},
  );
}
