import MealPlanEditor from "@/components/meal-plans/MealPlanEditor";
import { getMealPlanningData, getUpcomingWeekStart, getWeekStart } from "@/lib/meal-plans";
import { getAvailableMealSlots } from "@/lib/meal-plans/constants";

type MealPlansPageProps = {
  searchParams: Promise<{ week?: string }>;
};

export default async function MealPlansPage({ searchParams }: MealPlansPageProps) {
  const { week } = await searchParams;
  const requestedWeekStart = getWeekStart(week);
  const upcomingWeekStart = getUpcomingWeekStart();
  const weekStartDate = requestedWeekStart > upcomingWeekStart ? upcomingWeekStart : requestedWeekStart;
  const data = await getMealPlanningData(weekStartDate);

  if (!data.household) {
    throw new Error("Your household is not available yet. Please refresh the page and try again.");
  }

  return <MealPlanEditor weekStartDate={weekStartDate} availableMealSlots={getAvailableMealSlots(weekStartDate)} {...data} />;
}
