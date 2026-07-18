import { BarChart3, CalendarDays, ChefHat, Package, ShoppingCart, UserRound, type LucideIcon } from "lucide-react";
import Link from "next/link";

type DashboardModule = {
  title: string;
  description: string;
  icon: LucideIcon;
  accent: "emerald" | "cyan";
  href: string;
  isComingSoon?: boolean;
};

const dashboardModules: DashboardModule[] = [
  {
    title: "Meal Planning",
    description: "Your weekly plans will appear here once meal planning is available.",
    icon: CalendarDays,
    accent: "emerald",
    href: "/dashboard/meal-plans",
  },
  {
    title: "Pantry",
    description: "Keep track of ingredients at home when pantry management launches.",
    icon: Package,
    accent: "cyan",
    href: "/dashboard/pantry",
  },
  {
    title: "Grocery List",
    description: "Your smart grocery list will be ready here in a future update.",
    icon: ShoppingCart,
    accent: "emerald",
    href: "/dashboard/grocery",
  },
  {
    title: "Recipes",
    description: "Browse and manage the recipes used in your weekly plans.",
    icon: ChefHat,
    accent: "cyan",
    href: "/dashboard/recipes",
  },
  {
    title: "Nutrition",
    description: "Nutrition insights will live here when tracking becomes available.",
    icon: BarChart3,
    accent: "cyan",
    href: "/dashboard/nutrition",
    isComingSoon: true,
  },
  {
    title: "Profile",
    description: "Manage your household preferences and account details.",
    icon: UserRound,
    accent: "emerald",
    href: "/dashboard/profile",
  },
];

export default function DashboardOverview() {
  return (
    <section aria-labelledby="dashboard-overview-heading">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-widest text-emerald-400/80">Overview</p>
        <h1 id="dashboard-overview-heading" className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Build your better kitchen week</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-zinc-400">Your Nutriweek workspace is ready. The first kitchen tools are on their way.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardModules.map((module) => {
          const Icon = module.icon;
          const accentClass = module.accent === "emerald" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-cyan-500/20 bg-cyan-500/10 text-cyan-400";

          return (
            <Link key={module.title} href={module.href} className="group cursor-pointer rounded-3xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-emerald-400/30">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${accentClass}`}>
                <Icon className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <h2 className="mt-5 text-lg font-semibold text-white">{module.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{module.description}</p>
              {module.isComingSoon ? <span className="mt-5 inline-flex rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs font-medium text-zinc-400">Coming soon</span> : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
