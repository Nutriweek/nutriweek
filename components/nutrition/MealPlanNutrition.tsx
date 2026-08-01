import {
  averageNutrition,
  formatNutrition,
  groupNutritionByDay,
  sumNutrition,
  type Nutrition,
} from "@/lib/nutrition";

type PlannedNutritionItem = Nutrition & { meal_date: string };

export function MealNutrition({ nutrition }: { nutrition: Nutrition }) {
  return (
    <p className="mt-3 flex flex-wrap gap-x-3 text-xs font-medium">
      <span className="text-emerald-300">
        {formatNutrition(nutrition.calories_kcal ?? 0, "kcal")}
      </span>
      <span className="text-cyan-200">
        {formatNutrition(nutrition.protein_g ?? 0, "g")} protein
      </span>
    </p>
  );
}

export function DailyNutrition({ meals }: { meals: PlannedNutritionItem[] }) {
  const total = sumNutrition(meals);
  return (
    <div className="mt-3 grid grid-cols-4 divide-x divide-white/[0.08] overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03]">
      <DailyMetric emoji="🔥" label="Calories" value={formatNutrition(total.calories_kcal, "kcal")} />
      <DailyMetric emoji="💪" label="Protein" value={formatNutrition(total.protein_g, "g")} />
      <DailyMetric emoji="🌾" label="Carbs" value={formatNutrition(total.carbohydrates_g, "g")} />
      <DailyMetric emoji="🥑" label="Fat" value={formatNutrition(total.fat_g, "g")} />
    </div>
  );
}

function DailyMetric({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return <div className="min-w-0 px-2.5 py-2 text-center sm:px-3"><p className="truncate text-[10px] font-medium text-zinc-500 sm:text-xs"><span aria-hidden="true">{emoji}</span> {label}</p><p className="mt-0.5 truncate text-xs font-semibold text-zinc-100 sm:text-sm">{value}</p></div>;
}

export function WeeklyNutritionSummary({
  meals,
}: {
  meals: PlannedNutritionItem[];
}) {
  const dailyTotals = groupNutritionByDay(meals);
  const average = averageNutrition(
    sumNutrition(meals),
    Object.keys(dailyTotals).length,
  );
  return (
    <section className="rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/[0.10] to-cyan-500/[0.04] p-5 sm:p-6">
      <p className="text-sm font-medium uppercase tracking-widest text-emerald-300">
        Nutrition engine
      </p>
      <h2 className="mt-2 text-xl font-semibold text-white">
        Weekly Nutrition Summary
      </h2>
      <p className="mt-1 text-sm text-zinc-400">
        Average per planned day, based on one serving of each meal.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <NutritionValue
          label="Average calories / day"
          value={formatNutrition(average.calories_kcal, "kcal")}
          prominent
        />
        <NutritionValue
          label="Average protein / day"
          value={formatNutrition(average.protein_g, "g")}
          prominent
        />
        <NutritionValue
          label="Average carbs / day"
          value={formatNutrition(average.carbohydrates_g, "g")}
          prominent
        />
        <NutritionValue
          label="Average fat / day"
          value={formatNutrition(average.fat_g, "g")}
          prominent
        />
      </div>
    </section>
  );
}

function NutritionValue({
  label,
  value,
  prominent = false,
}: {
  label: string;
  value: string;
  prominent?: boolean;
}) {
  return (
    <div
      className={
        prominent
          ? "rounded-2xl border border-white/[0.08] bg-black/15 p-4"
          : ""
      }
    >
      <p className="text-xs text-zinc-400">{label}</p>
      <p
        className={`${prominent ? "mt-2 text-xl" : "mt-1 text-base"} font-semibold text-white`}
      >
        {value}
      </p>
    </div>
  );
}
