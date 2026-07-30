"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import {
  getUpcomingWeekStart,
  getWeekStart,
  shiftWeek,
} from "@/lib/meal-plans/constants";

export default function WeekNavigation({
  weekStartDate,
  hrefBase,
}: {
  weekStartDate: string;
  hrefBase: string;
}) {
  const currentWeek = getWeekStart();
  const nextWeek = getUpcomingWeekStart();
  const weekHref = (week: string) => `${hrefBase}?week=${week}`;

  return (
    <div className="flex items-center gap-2">
      <Link
        href={weekHref(currentWeek)}
        aria-label="Current week"
        className={`inline-flex h-10 items-center justify-center rounded-xl border px-3 text-sm font-medium transition ${weekStartDate === currentWeek ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200" : "border-white/10 bg-white/5 text-zinc-300 hover:text-white"}`}
      >
        Current
      </Link>
      <Link
        href={weekHref(nextWeek)}
        aria-label="Next week"
        className={`inline-flex h-10 items-center justify-center rounded-xl border px-3 text-sm font-medium transition ${weekStartDate === nextWeek ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200" : "border-white/10 bg-white/5 text-zinc-300 hover:text-white"}`}
      >
        Next
      </Link>
      <Link
        href={weekHref(shiftWeek(weekStartDate, -1))}
        aria-label="Previous week"
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 transition hover:text-white"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      </Link>
      <Link
        href={weekHref(
          weekStartDate === nextWeek ? nextWeek : shiftWeek(weekStartDate, 1),
        )}
        aria-label="Next week"
        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 ${weekStartDate === nextWeek ? "cursor-not-allowed text-zinc-600" : "text-zinc-300 hover:text-white"}`}
        aria-disabled={weekStartDate === nextWeek}
        onClick={(event) => {
          if (weekStartDate === nextWeek) event.preventDefault();
        }}
      >
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </Link>
    </div>
  );
}
