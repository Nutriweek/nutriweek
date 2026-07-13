import MealPlanEditor from "@/components/meal-plans/MealPlanEditor";
import { getMealPlanningData, getWeekStart } from "@/lib/meal-plans";

type MealPlansPageProps = {
  searchParams: Promise<{ week?: string }>;
};

export default async function MealPlansPage({ searchParams }: MealPlansPageProps) {
  const { week } = await searchParams;
  const data = await getMealPlanningData(getWeekStart(week));

  if (!data.household) {
    throw new Error("Your household is not available yet. Please refresh the page and try again.");
  }

  return <MealPlanEditor weekStartDate={getWeekStart(week)} {...data} />;
}
