import Link from "next/link";

import WeekNavigation from "@/components/meal-plans/WeekNavigation";
import { formatWeekRange } from "@/lib/meal-plans/constants";
import {
  averageNutrition,
  formatNutrition,
  groupNutritionByDay,
  sumNutrition,
} from "@/lib/nutrition";
import type { PlannedMealItem } from "@/lib/meal-plans/types";

export default function NutritionDashboard({
  meals,
  weekStartDate,
  hasMealPlan,
}: {
  meals: PlannedMealItem[];
  weekStartDate: string;
  hasMealPlan: boolean;
}) {
  const daily = groupNutritionByDay(meals);
  const totals = sumNutrition(meals);
  const average = averageNutrition(totals, Object.keys(daily).length);
  const rankedByProtein = [...meals]
    .sort((left, right) => (right.protein_g ?? 0) - (left.protein_g ?? 0))
    .slice(0, 5);
  const rankedByCalories = [...meals]
    .sort(
      (left, right) => (right.calories_kcal ?? 0) - (left.calories_kcal ?? 0),
    )
    .slice(0, 5);
  const macroCalories = {
    protein: totals.protein_g * 4,
    carbs: totals.carbohydrates_g * 4,
    fat: totals.fat_g * 9,
  };
  const macroTotal =
    macroCalories.protein + macroCalories.carbs + macroCalories.fat;
  const macroRows = [
    ["Protein", macroCalories.protein, "bg-emerald-400"],
    ["Carbs", macroCalories.carbs, "bg-cyan-400"],
    ["Fat", macroCalories.fat, "bg-amber-300"],
  ] as const;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <header className="rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/[0.12] to-cyan-500/[0.04] p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-emerald-300">
              Nutrition engine
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Nutrition
            </h1>
            <p className="mt-2 text-lg font-medium text-emerald-100">
              {formatWeekRange(weekStartDate)}
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-300">
              Your weekly nutrition view is calculated from the recipes in this
              meal plan, with every recipe measured per serving.
            </p>
          </div>
          <WeekNavigation
            weekStartDate={weekStartDate}
            hrefBase="/dashboard/nutrition"
          />
        </div>
      </header>
      {meals.length ? (
        <>
          <section>
            <h2 className="text-xl font-semibold text-white">
              Weekly averages
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat
                label="Calories / day"
                value={formatNutrition(average.calories_kcal, "kcal")}
              />
              <Stat
                label="Protein / day"
                value={formatNutrition(average.protein_g, "g")}
              />
              <Stat
                label="Carbs / day"
                value={formatNutrition(average.carbohydrates_g, "g")}
              />
              <Stat
                label="Fat / day"
                value={formatNutrition(average.fat_g, "g")}
              />
            </div>
          </section>
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-6">
              <h2 className="text-xl font-semibold text-white">
                Macro distribution
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                Share of calories from planned macros.
              </p>
              <div className="mt-6 space-y-5">
                {macroRows.map(([label, calories, color]) => {
                  const percent = macroTotal
                    ? Math.round((calories / macroTotal) * 100)
                    : 0;
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-300">{label}</span>
                        <span className="font-medium text-white">
                          {percent}%
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.08]">
                        <div
                          className={`h-full rounded-full ${color}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
            <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-6">
              <h2 className="text-xl font-semibold text-white">
                Daily breakdown
              </h2>
              <div className="mt-4 space-y-3">
                {Object.entries(daily).map(([date, nutrition]) => (
                  <div
                    key={date}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-black/15 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-white">
                        {new Intl.DateTimeFormat("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        }).format(new Date(`${date}T00:00:00`))}
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        {formatNutrition(nutrition.protein_g, "g")} protein ·{" "}
                        {formatNutrition(nutrition.carbohydrates_g, "g")} carbs
                        · {formatNutrition(nutrition.fat_g, "g")} fat
                      </p>
                    </div>
                    <p className="font-semibold text-emerald-300">
                      {formatNutrition(nutrition.calories_kcal, "kcal")}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <MealRanking
              title="Top Protein Meals"
              meals={rankedByProtein}
              value={(meal) => formatNutrition(meal.protein_g ?? 0, "g")}
              unit="protein"
              weekStartDate={weekStartDate}
            />
            <MealRanking
              title="Highest Calorie Meals"
              meals={rankedByCalories}
              value={(meal) => formatNutrition(meal.calories_kcal ?? 0, "kcal")}
              unit=""
              weekStartDate={weekStartDate}
            />
          </div>
        </>
      ) : hasMealPlan ? (
        <section className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center">
          <h2 className="text-xl font-semibold text-white">
            No meals planned yet
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Plan your meals to see your nutrition summary, macros and meal
            insights here.
          </p>
          <Link
            href={`/dashboard/meal-plans?week=${weekStartDate}`}
            className="mt-5 inline-flex rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-emerald-950"
          >
            Plan meals
          </Link>
        </section>
      ) : (
        <section className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center">
          <h2 className="text-xl font-semibold text-white">
            No meal plan exists for this week yet.
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Create a meal plan to unlock your weekly nutrition summary, macros
            and meal insights.
          </p>
          <Link
            href={`/dashboard/meal-plans?week=${weekStartDate}`}
            className="mt-5 inline-flex rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-emerald-950"
          >
            Create Meal Plan
          </Link>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
      <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
function MealRanking({
  title,
  meals,
  value,
  unit,
  weekStartDate,
}: {
  title: string;
  meals: PlannedMealItem[];
  value: (meal: PlannedMealItem) => string;
  unit: string;
  weekStartDate: string;
}) {
  return (
    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-6">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="mt-4 space-y-2">
        {meals.map((meal) => (
          <Link
            key={meal.id}
            href={
              meal.recipe_id
                ? `/dashboard/recipes/${meal.recipe_id}?week=${weekStartDate}`
                : `/dashboard/meal-plans?week=${weekStartDate}`
            }
            className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/15 px-4 py-3 transition hover:border-emerald-400/30"
          >
            <span className="font-medium text-zinc-100">
              {meal.recipe_name ?? meal.title ?? "Meal"}
            </span>
            <span className="text-sm font-semibold text-emerald-300">
              {value(meal)} {unit}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
