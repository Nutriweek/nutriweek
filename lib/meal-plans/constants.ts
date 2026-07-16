export function getWeekStart(value?: string) {
  const date = value && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00.000Z`)
    : new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));
  const day = date.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;

  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  return date.toISOString().slice(0, 10);
}

export function getWeekEnd(weekStartDate: string) {
  const date = new Date(`${weekStartDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 5);
  return date.toISOString().slice(0, 10);
}

export function shiftWeek(weekStartDate: string, amount: number) {
  const date = new Date(`${weekStartDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount * 7);
  return date.toISOString().slice(0, 10);
}

export function formatWeekRange(weekStartDate: string) {
  const start = new Date(`${weekStartDate}T00:00:00.000Z`);
  const end = new Date(`${getWeekEnd(weekStartDate)}T00:00:00.000Z`);
  const formatter = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });

  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

export function getUpcomingWeekStart() {
  return shiftWeek(getWeekStart(), 1);
}

export const PLANNING_MEAL_CATEGORIES = ["breakfast", "lunch", "dinner"] as const;
export type PlanningMealCategory = (typeof PLANNING_MEAL_CATEGORIES)[number];
export type MealSlotSelection = { meal_date: string; meal_category_slug: PlanningMealCategory };

const mealCutoffs: Record<PlanningMealCategory, number> = { breakfast: 10 * 60, lunch: 14 * 60, dinner: 22 * 60 };

export function getAvailableMealSlots(weekStartDate: string, now = new Date()): MealSlotSelection[] {
  const currentWeekStart = getWeekStart();
  const upcomingWeekStart = getUpcomingWeekStart();
  if (weekStartDate !== currentWeekStart && weekStartDate !== upcomingWeekStart) return [];

  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  if (weekStartDate === currentWeekStart && currentMinutes >= mealCutoffs.dinner) return [];
  return Array.from({ length: 6 }, (_, offset) => {
    const date = new Date(`${weekStartDate}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + offset);
    return date.toISOString().slice(0, 10);
  }).flatMap((mealDate) => PLANNING_MEAL_CATEGORIES.flatMap((mealCategory) => (
    weekStartDate === upcomingWeekStart || mealDate > today || (mealDate === today && currentMinutes < mealCutoffs[mealCategory])
      ? [{ meal_date: mealDate, meal_category_slug: mealCategory }]
      : []
  )));
}
