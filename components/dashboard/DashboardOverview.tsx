import { CalendarDays, ChevronRight, ChefHat, Package, ShoppingBasket, Sparkles, Utensils } from "lucide-react";
import Link from "next/link";

import { formatNutrition, sumNutrition } from "@/lib/nutrition";
import { formatWeekRange } from "@/lib/meal-plans";
import type { PlannedMealItem, WeeklyMealPlan } from "@/lib/meal-plans/types";
import type { Profile } from "@/lib/profile/types";

type Props = {
  profile: Profile | null;
  email: string | null;
  weekStartDate: string;
  plan: WeeklyMealPlan | null;
  todayMeals: PlannedMealItem[];
  pantryItemCount: number;
  grocery: { total: number; purchased: number; remaining: number } | null;
  recentlyCooked: { id: string; name: string; cover_image_path: string | null; mealDate: string }[];
};

const mealOrder: Record<string, number> = { breakfast: 1, lunch: 2, dinner: 3, snack: 4, snacks: 4, dessert: 5, desserts: 5 };

function greeting() {
  const hour = Number(new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", hourCycle: "h23" }).format(new Date()));
  return hour < 12 ? "Good Morning 👋" : hour < 17 ? "Good Afternoon 👋" : "Good Evening 👋";
}

function planStatus(plan: WeeklyMealPlan | null) {
  if (!plan) return "No Meal Plan Yet";
  if (plan.status === "purchased") return "Purchased";
  if (["approved", "grocery_generated"].includes(plan.status)) return "Grocery List Ready";
  if (plan.status === "prepared_for_review") return "Awaiting Approval";
  return "Meal Plan Ready";
}

function activeWeekStatuses(plan: WeeklyMealPlan | null) {
  if (!plan) return [];
  const generated = plan.status !== "draft";
  const awaitingApproval = plan.status === "prepared_for_review";
  const groceryReady = ["grocery_generated", "purchased"].includes(plan.status);
  return [generated ? "✓ Meal Plan Generated" : null, awaitingApproval ? "✓ Awaiting Approval" : null, groceryReady ? "✓ Grocery List Ready" : null, plan.status === "purchased" ? "✓ Purchased" : null].filter((status): status is string => Boolean(status));
}

function groceryEmptyMessage(plan: WeeklyMealPlan | null) {
  if (!plan) return "Create a meal plan to generate your grocery list.";
  if (plan.status === "prepared_for_review") return "Approve your meal plan to generate this week's grocery list.";
  return "Your grocery list will be ready once this meal plan is approved.";
}

export default function DashboardOverview({ profile, email, weekStartDate, plan, todayMeals, pantryItemCount, grocery, recentlyCooked }: Props) {
  const sortedMeals = [...todayMeals].sort((left, right) => (mealOrder[left.meal_category_name.toLowerCase()] ?? Number.MAX_SAFE_INTEGER) - (mealOrder[right.meal_category_name.toLowerCase()] ?? Number.MAX_SAFE_INTEGER) || left.slot_index - right.slot_index);
  const todayNutrition = sumNutrition(todayMeals);
  const fullName = profile?.full_name?.trim();
  const emailPrefix = email?.split("@")[0]?.trim();
  const name = fullName || emailPrefix || "there";
  const todayDate = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" }).format(new Date());
  const status = planStatus(plan);
  const statuses = activeWeekStatuses(plan);

  return <div className="mx-auto max-w-7xl space-y-6 pb-10"><section className="rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/[0.12] to-cyan-500/[0.04] p-6 sm:p-8"><p className="text-sm font-medium uppercase tracking-widest text-emerald-300">{greeting()}</p><div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{name}</h1><p className="mt-2 text-sm text-zinc-300">{todayDate} · Your kitchen is organized.</p></div><span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-500/10 px-3 py-1.5 text-sm font-semibold text-emerald-100"><Sparkles className="h-4 w-4 text-emerald-300" aria-hidden="true" />{status}</span></div></section>

    <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]"><section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-6"><SectionHeading icon={Utensils} title="Today’s Meals" /><div className="mt-5">{sortedMeals.length ? <div className="grid gap-3 sm:grid-cols-2">{sortedMeals.map((meal) => <Link key={meal.id} href={meal.recipe_id ? `/dashboard/recipes/${meal.recipe_id}?week=${weekStartDate}&mealCategory=${encodeURIComponent(meal.meal_category_name)}` : "/dashboard/meal-plans"} className="group rounded-2xl border border-white/[0.08] bg-black/15 p-4 transition hover:border-emerald-400/30"><p className="text-xs font-medium uppercase tracking-wider text-emerald-300">{meal.meal_category_name}</p><p className="mt-2 flex items-center justify-between gap-3 font-semibold text-white">{meal.recipe_name ?? meal.title ?? "Planned meal"}<ChevronRight className="h-4 w-4 shrink-0 text-zinc-500 transition group-hover:text-emerald-300" aria-hidden="true" /></p></Link>)}</div> : <EmptyToday weekStartDate={weekStartDate} />}</div></section>
    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-6"><SectionHeading icon={CalendarDays} title="Current Week" /><p className="mt-4 text-sm font-medium text-white">{formatWeekRange(weekStartDate)}</p>{statuses.length ? <div className="mt-4 flex flex-wrap gap-2">{statuses.map((item) => <span key={item} className="rounded-full border border-emerald-400/20 bg-emerald-500/[0.08] px-2.5 py-1 text-xs font-medium text-emerald-100">{item}</span>)}</div> : <p className="mt-4 text-sm text-zinc-500">Start a meal plan for a clear view of your week.</p>}<DashboardLink href={`/dashboard/meal-plans?week=${weekStartDate}`} label="Open Meal Plan" /></section></div>

    <div className="grid gap-6 lg:grid-cols-3"><section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-6"><SectionHeading icon={Sparkles} title="Today’s Nutrition" /><dl className="mt-5 grid grid-cols-2 gap-3"><Metric label="Calories" value={formatNutrition(todayNutrition.calories_kcal, "kcal")} /><Metric label="Protein" value={formatNutrition(todayNutrition.protein_g, "g")} /><Metric label="Carbs" value={formatNutrition(todayNutrition.carbohydrates_g, "g")} /><Metric label="Fat" value={formatNutrition(todayNutrition.fat_g, "g")} /></dl></section>
    <Snapshot title="Grocery Snapshot" icon={ShoppingBasket} href={`/dashboard/grocery?week=${weekStartDate}`} action="Open Grocery List">{grocery ? <dl className="mt-5 grid grid-cols-3 gap-2"><Metric label="Total Items" value={String(grocery.total)} /><Metric label="Purchased" value={String(grocery.purchased)} /><Metric label="Remaining" value={String(grocery.remaining)} /></dl> : <p className="mt-5 text-sm leading-relaxed text-zinc-500">{groceryEmptyMessage(plan)}</p>}</Snapshot>
    <Snapshot title="Pantry Snapshot" icon={Package} href="/dashboard/pantry" action="Open Pantry"><dl className="mt-5"><Metric label="Available pantry items" value={String(pantryItemCount)} /></dl></Snapshot></div>

    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-6"><SectionHeading icon={Sparkles} title="Quick Actions" /><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><QuickAction href={`/dashboard/meal-plans?week=${weekStartDate}`} label="Open Meal Planner" icon={CalendarDays} /><QuickAction href="/dashboard/recipes" label="Browse Recipes" icon={ChefHat} /><QuickAction href={`/dashboard/grocery?week=${weekStartDate}`} label="Grocery List" icon={ShoppingBasket} /><QuickAction href={`/dashboard/nutrition?week=${weekStartDate}`} label="Nutrition" icon={Sparkles} /></div></section>

    {recentlyCooked.length ? <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-6"><SectionHeading icon={ChefHat} title="Recently Cooked" /><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{recentlyCooked.map((recipe) => <Link key={`${recipe.id}-${recipe.mealDate}`} href={`/dashboard/recipes/${recipe.id}`} className="group rounded-2xl border border-white/[0.08] bg-black/15 p-4 transition hover:border-emerald-400/30"><p className="font-semibold text-white">{recipe.name}</p><p className="mt-2 text-xs text-zinc-500">{new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${recipe.mealDate}T00:00:00`))}</p></Link>)}</div></section> : null}</div>;
}

function SectionHeading({ icon: Icon, title }: { icon: typeof Utensils; title: string }) { return <div className="flex items-center gap-2.5"><span className="rounded-xl border border-emerald-400/15 bg-emerald-500/[0.08] p-2 text-emerald-300"><Icon className="h-4 w-4" aria-hidden="true" /></span><h2 className="text-lg font-semibold text-white">{title}</h2></div>; }
function DashboardLink({ href, label }: { href: string; label: string }) { return <Link href={href} className="mt-5 inline-flex h-10 items-center rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-zinc-200 transition hover:border-emerald-400/30 hover:text-white">{label}</Link>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/[0.08] bg-black/15 p-3"><dt className="text-xs text-zinc-500">{label}</dt><dd className="mt-1 text-sm font-semibold text-white">{value}</dd></div>; }
function Snapshot({ title, icon, href, action, children }: { title: string; icon: typeof Utensils; href: string; action: string; children: React.ReactNode }) { return <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-6"><SectionHeading icon={icon} title={title} />{children}<DashboardLink href={href} label={action} /></section>; }
function QuickAction({ href, label, icon: Icon }: { href: string; label: string; icon: typeof Utensils }) { return <Link href={href} className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-black/15 px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:border-emerald-400/30 hover:bg-emerald-500/[0.06]"><span>{label}</span><Icon className="h-4 w-4 text-emerald-300" aria-hidden="true" /></Link>; }
function EmptyToday({ weekStartDate }: { weekStartDate: string }) { return <div className="rounded-2xl border border-dashed border-white/15 px-5 py-8 text-center"><p className="text-sm text-zinc-400">No meals planned today.</p><DashboardLink href={`/dashboard/meal-plans?week=${weekStartDate}`} label="Open Meal Planner" /></div>; }
