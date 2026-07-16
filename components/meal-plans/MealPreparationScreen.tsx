"use client";

import { CalendarPlus, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MealSlotSelection } from "@/lib/meal-plans/constants";
import { WEEKLY_PREFERENCES, WEEKLY_PREFERENCE_VALUES, type WeeklyPreference } from "@/lib/planning/weekly-preferences";

type MealPreparationScreenProps = {
  slots: MealSlotSelection[];
  initialSlots: MealSlotSelection[];
  categoryLabels: Record<string, string>;
  allowSlotSelection: boolean;
  initialPreference: WeeklyPreference;
  isGenerating: boolean;
  message: { type: "error" | "success"; text: string } | null;
  onGenerate: (preference: WeeklyPreference, slots: MealSlotSelection[]) => void;
};

function keyFor(slot: MealSlotSelection) {
  return `${slot.meal_date}:${slot.meal_category_slug}`;
}

export default function MealPreparationScreen({ slots, initialSlots, categoryLabels, allowSlotSelection, initialPreference, isGenerating, message, onGenerate }: MealPreparationScreenProps) {
  const [preference, setPreference] = useState(initialPreference);
  const [selectedSlots, setSelectedSlots] = useState(initialSlots);
  const groupedSlots = slots.reduce<Record<string, MealSlotSelection[]>>((groups, slot) => ({ ...groups, [slot.meal_date]: [...(groups[slot.meal_date] ?? []), slot] }), {});
  const selectedKeys = new Set(selectedSlots.map(keyFor));

  function toggleSlot(slot: MealSlotSelection) {
    const key = keyFor(slot);
    setSelectedSlots((current) => current.some((item) => keyFor(item) === key) ? current.filter((item) => keyFor(item) !== key) : [...current, slot]);
  }

  if (slots.length === 0) return <section className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center sm:p-10"><CalendarPlus className="mx-auto h-10 w-10 text-emerald-400" aria-hidden="true" /><h1 className="mt-4 text-2xl font-semibold text-white">Today&apos;s meals have finished</h1><p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-zinc-400">Prepare next week&apos;s meals when you&apos;re ready.</p><Link href="/dashboard/meal-plans" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-3 font-semibold text-white">Prepare Next Week</Link></section>;

  return <section className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-5 sm:p-8"><div className="text-center"><CalendarPlus className="mx-auto h-10 w-10 text-emerald-400" aria-hidden="true" /><h1 className="mt-4 text-2xl font-semibold text-white">Prepare {allowSlotSelection ? "the rest of this week" : "next week&apos;s meals"}</h1><p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-zinc-400">{allowSlotSelection ? "Choose the meals to include, then Nutriweek will prepare a matching draft." : "Nutriweek will prepare a complete draft from recipes that match your saved constraints."}</p></div><div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-white/[0.08] bg-black/15 p-5"><h2 className="text-lg font-semibold text-white">Plan Your Week</h2><label htmlFor="weekly_preference" className="mt-4 block text-sm font-medium text-zinc-200">How would you like to eat this week?</label><Select value={preference} onValueChange={(value) => setPreference(value as WeeklyPreference)}><SelectTrigger id="weekly_preference" className="mt-2"><SelectValue /></SelectTrigger><SelectContent>{WEEKLY_PREFERENCE_VALUES.map((value) => <SelectItem key={value} value={value}>{WEEKLY_PREFERENCES[value].label}</SelectItem>)}</SelectContent></Select><p className="mt-4 text-sm leading-relaxed text-zinc-400">{WEEKLY_PREFERENCES[preference].description}</p><div className="mt-4 border-t border-white/[0.08] pt-4"><p className="text-xs font-medium uppercase tracking-widest text-zinc-500">Estimated Grocery Budget</p><p className="mt-1 text-lg font-semibold text-emerald-300">{WEEKLY_PREFERENCES[preference].budget}</p></div>{allowSlotSelection ? <fieldset className="mt-6"><legend className="text-lg font-semibold text-white">Meal slots to prepare</legend><p className="mt-1 text-sm text-zinc-400">Uncheck any meals you do not want included.</p><div className="mt-4 space-y-3">{Object.entries(groupedSlots).map(([date, daySlots]) => <div key={date} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4"><p className="text-sm font-medium text-emerald-300">{new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" }).format(new Date(`${date}T00:00:00`))}</p><div className="mt-3 grid gap-2 sm:grid-cols-3">{daySlots.map((slot) => <label key={keyFor(slot)} className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.08] bg-black/15 px-3 py-2.5 text-sm text-zinc-200"><input type="checkbox" checked={selectedKeys.has(keyFor(slot))} onChange={() => toggleSlot(slot)} className="h-4 w-4 accent-emerald-400" />{categoryLabels[slot.meal_category_slug] ?? slot.meal_category_slug}</label>)}</div></div>)}</div></fieldset> : null}</div><div className="mt-6 text-center"><button type="button" onClick={() => onGenerate(preference, selectedSlots)} disabled={isGenerating || selectedSlots.length === 0} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">{isGenerating ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> : <CalendarPlus className="h-5 w-5" aria-hidden="true" />}{isGenerating ? "Preparing meals..." : "Generate My Week"}</button>{message ? <p className={`mt-4 text-sm ${message.type === "success" ? "text-emerald-400" : "text-rose-400"}`} role={message.type === "error" ? "alert" : "status"}>{message.text}</p> : null}</div></section>;
}
