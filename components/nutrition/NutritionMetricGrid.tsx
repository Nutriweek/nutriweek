import {
  formatNutrition,
  nutritionMetrics,
  type Nutrition,
} from "@/lib/nutrition";

export default function NutritionMetricGrid({
  nutrition,
}: {
  nutrition: Nutrition;
}) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {nutritionMetrics.map(([label, key, unit]) => (
        <div
          key={key}
          className="rounded-2xl border border-white/[0.08] bg-black/15 p-4"
        >
          <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            {label}
          </dt>
          <dd className="mt-2 text-lg font-semibold text-white">
            {formatNutrition(nutrition[key] ?? 0, unit)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
