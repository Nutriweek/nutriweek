"use client";

import {
  BarChart3,
  CalendarDays,
  ChefHat,
  LayoutDashboard,
  Package,
  ShoppingCart,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavigationItem = {
  label: string;
  icon: LucideIcon;
  href?: string;
};

const navigationItems: NavigationItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Meal Plans", icon: CalendarDays, href: "/dashboard/meal-plans" },
  { label: "Pantry", icon: Package, href: "/dashboard/pantry" },
  { label: "Grocery List", icon: ShoppingCart, href: "/dashboard/grocery" },
  { label: "Recipes", icon: ChefHat, href: "/dashboard/recipes" },
  { label: "Nutrition (Coming Soon)", icon: BarChart3, href: "/dashboard/nutrition" },
  { label: "Profile", icon: UserRound, href: "/dashboard/profile" },
];

function NavigationItems({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return navigationItems.map((item) => {
    const Icon = item.icon;
    const className = mobile
      ? "inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium"
      : "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium";

    if (item.href) {
      const isActive = item.href === "/dashboard" ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
      return (
        <Link
          key={item.label}
          href={item.href}
          aria-current={isActive ? "page" : undefined}
          className={`${className} ${
            isActive
              ? "bg-emerald-500/10 text-emerald-300"
              : "text-zinc-400 transition hover:bg-white/[0.05] hover:text-white"
          }`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          {item.label}
        </Link>
      );
    }

    return (
      <span
        key={item.label}
        aria-disabled="true"
        className={`${className} cursor-not-allowed text-zinc-500`}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
        {item.label}
      </span>
    );
  });
}

export default function Sidebar() {
  return (
    <>
      <aside className="hidden w-72 shrink-0 border-r border-white/[0.08] bg-white/[0.02] p-5 lg:flex lg:flex-col">
        <Link href="/dashboard" className="px-3 text-xl font-semibold tracking-tight text-white">
          Nutri<span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">week</span>
        </Link>
        <nav className="mt-10 space-y-1" aria-label="Dashboard navigation">
          <NavigationItems />
        </nav>
      </aside>

      <nav className="border-b border-white/[0.08] bg-[#050505]/95 px-4 py-3 backdrop-blur-xl lg:hidden" aria-label="Dashboard navigation">
        <div className="flex gap-1 overflow-x-auto pb-1">
          <NavigationItems mobile />
        </div>
      </nav>
    </>
  );
}
