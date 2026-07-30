import NutritionDashboard from "@/components/nutrition/NutritionDashboard";
import { getMealPlanningData, getNavigableWeekStart } from "@/lib/meal-plans";

type NutritionPageProps = {
  searchParams: Promise<{ week?: string }>;
};

export default async function NutritionPage({
  searchParams,
}: NutritionPageProps) {
  const { week } = await searchParams;
  const weekStartDate = getNavigableWeekStart(week);
  const { plan, items } = await getMealPlanningData(weekStartDate);
  return (
    <NutritionDashboard
      meals={items}
      weekStartDate={weekStartDate}
      hasMealPlan={Boolean(plan)}
    />
  );
}
