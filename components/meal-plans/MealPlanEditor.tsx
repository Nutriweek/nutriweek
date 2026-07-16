"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarPlus, CheckCircle2, ChevronLeft, ChevronRight, LoaderCircle, Plus, Utensils } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import ProfileField from "@/components/profile/ProfileField";
import MealPreparationScreen from "@/components/meal-plans/MealPreparationScreen";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addMealPlanItem } from "@/lib/meal-plans/actions";
import { formatWeekRange, getUpcomingWeekStart, getWeekEnd, getWeekStart, shiftWeek } from "@/lib/meal-plans/constants";
import type { MealSlotSelection } from "@/lib/meal-plans/constants";
import { addMealPlanItemSchema, type AddMealPlanItemInput } from "@/lib/meal-plans/schemas";
import { DEFAULT_WEEKLY_PREFERENCE, WEEKLY_PREFERENCES, WEEKLY_PREFERENCE_VALUES, type WeeklyPreference } from "@/lib/planning/weekly-preferences";
import type { MealCategory, MealSlotType, PlannedMealItem, Recipe, WeeklyMealPlan } from "@/lib/meal-plans/types";
import { approveWeeklyPlan, prepareWeeklyPlan } from "@/lib/planning/actions";

type MealPlanEditorProps = {
  weekStartDate: string;
  availableMealSlots: MealSlotSelection[];
  plan: WeeklyMealPlan | null;
  items: PlannedMealItem[];
  mealCategories: MealCategory[];
  mealSlotTypes: MealSlotType[];
  recipes: Pick<Recipe, "id" | "name" | "servings">[];
};

const inputClassName = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-zinc-500 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20";

function getWeeklyPreference(generationContext: unknown): WeeklyPreference {
  if (generationContext && typeof generationContext === "object" && !Array.isArray(generationContext)) {
    const preference = (generationContext as Record<string, unknown>).weekly_preference;
    if (typeof preference === "string" && WEEKLY_PREFERENCE_VALUES.includes(preference as WeeklyPreference)) return preference as WeeklyPreference;
  }
  return DEFAULT_WEEKLY_PREFERENCE;
}

function getSelectedMealSlots(generationContext: unknown, availableSlots: MealSlotSelection[]) {
  if (!generationContext || typeof generationContext !== "object" || Array.isArray(generationContext)) return availableSlots;
  const savedSlots = (generationContext as Record<string, unknown>).selected_meal_slots;
  if (!Array.isArray(savedSlots)) return availableSlots;
  const allowed = new Set(availableSlots.map((slot) => `${slot.meal_date}:${slot.meal_category_slug}`));
  const selected = savedSlots.flatMap((slot) => {
    if (!slot || typeof slot !== "object") return [];
    const value = slot as Record<string, unknown>;
    const meal_date = value.meal_date;
    const meal_category_slug = value.meal_category_slug;
    if (typeof meal_date !== "string" || !["breakfast", "lunch", "dinner"].includes(String(meal_category_slug))) return [];
    const selectedSlot = { meal_date, meal_category_slug: meal_category_slug as MealSlotSelection["meal_category_slug"] };
    return allowed.has(`${selectedSlot.meal_date}:${selectedSlot.meal_category_slug}`) ? [selectedSlot] : [];
  });
  return selected.length ? selected : availableSlots;
}

export default function MealPlanEditor({ weekStartDate, availableMealSlots, plan, items, mealCategories, mealSlotTypes, recipes }: MealPlanEditorProps) {
  const router = useRouter();
  const [createMessage, setCreateMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isPreparing, setIsPreparing] = useState(!plan);
  const [itemMessage, setItemMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [weeklyPreference, setWeeklyPreference] = useState<WeeklyPreference>(() => getWeeklyPreference(plan?.generation_context));
  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<AddMealPlanItemInput>({
    resolver: zodResolver(addMealPlanItemSchema),
    defaultValues: { meal_plan_id: plan?.id ?? "", meal_date: weekStartDate, meal_category_id: mealCategories[0]?.id ?? "", meal_slot_type_id: mealSlotTypes[0]?.id ?? "", recipe_id: "", servings: null, title: "", notes: "" },
  });
  const selectedSlotTypeId = useWatch({ control, name: "meal_slot_type_id" });
  const selectedSlotType = mealSlotTypes.find((slotType) => slotType.id === selectedSlotTypeId);
  const groupedItems = useMemo(() => items.reduce<Record<string, PlannedMealItem[]>>((groups, item) => ({ ...groups, [item.meal_date]: [...(groups[item.meal_date] ?? []), item] }), {}), [items]);
  const canNavigateNext = weekStartDate !== getUpcomingWeekStart();

  async function generateSelectedPlan(preference: WeeklyPreference, selectedSlots: MealSlotSelection[]) {
    setCreateMessage(null);
    setWeeklyPreference(preference);
    setIsCreating(true);
    const result = await prepareWeeklyPlan({ week_start_date: weekStartDate, weekly_preference: preference, selected_meal_slots: selectedSlots });
    setIsCreating(false);
    setCreateMessage({ type: result.success ? "success" : "error", text: result.message });
    if (result.success) { setIsPreparing(false); router.refresh(); }
  }

  function handleCreatePlan() { if (plan) setIsPreparing(true); }

  async function handleApprovePlan() {
    if (!plan) return;
    setCreateMessage(null);
    setIsApproving(true);
    const result = await approveWeeklyPlan({ meal_plan_id: plan.id });
    setIsApproving(false);
    setCreateMessage({ type: result.success ? "success" : "error", text: result.message });
    if (result.success) router.push("/dashboard/grocery");
  }

  async function onSubmit(values: AddMealPlanItemInput) {
    setItemMessage(null);
    const result = await addMealPlanItem(values);
    setItemMessage({ type: result.success ? "success" : "error", text: result.message });
    if (result.success) {
      reset({ ...values, recipe_id: "", servings: null, title: "", notes: "" });
      router.refresh();
    }
  }

  if (isPreparing) return <MealPreparationScreen slots={availableMealSlots} initialSlots={getSelectedMealSlots(plan?.generation_context, availableMealSlots)} categoryLabels={Object.fromEntries(mealCategories.map((category) => [category.slug, category.name]))} allowSlotSelection={weekStartDate === getWeekStart()} initialPreference={weeklyPreference} isGenerating={isCreating} message={createMessage} onGenerate={generateSelectedPlan} />;

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div><p className="text-sm font-medium uppercase tracking-widest text-emerald-400/80">Weekly meal plan</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{formatWeekRange(weekStartDate)}</h1><p className="mt-2 text-sm text-zinc-400">Meals are planned Monday through Saturday. Sunday is reserved for planning and groceries.</p></div>
      <div className="flex items-center gap-2"><Link href={`/dashboard/meal-plans?week=${shiftWeek(weekStartDate, -1)}`} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 transition hover:border-emerald-400/50 hover:text-white" aria-label="Previous week"><ChevronLeft className="h-5 w-5" aria-hidden="true" /></Link>{canNavigateNext ? <Link href={`/dashboard/meal-plans?week=${shiftWeek(weekStartDate, 1)}`} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 transition hover:border-emerald-400/50 hover:text-white" aria-label="Next week"><ChevronRight className="h-5 w-5" aria-hidden="true" /></Link> : <button type="button" disabled className="inline-flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-600" aria-label="Next week unavailable"><ChevronRight className="h-5 w-5" aria-hidden="true" /></button>}</div>
    </div>
    {!plan ? <section className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center sm:p-10"><CalendarPlus className="mx-auto h-10 w-10 text-emerald-400" aria-hidden="true" /><h2 className="mt-4 text-xl font-semibold text-white">Prepare next week&apos;s meals</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-zinc-400">Nutriweek will prepare a complete draft from recipes that match your saved constraints.</p><div className="mx-auto mt-6 max-w-lg rounded-2xl border border-white/[0.08] bg-black/15 p-5 text-left"><h3 className="text-lg font-semibold text-white">Plan Your Week</h3><label htmlFor="weekly_preference" className="mt-4 block text-sm font-medium text-zinc-200">How would you like to eat this week?</label><Select value={weeklyPreference} onValueChange={(value) => setWeeklyPreference(value as WeeklyPreference)}><SelectTrigger id="weekly_preference" className="mt-2"><SelectValue /></SelectTrigger><SelectContent>{WEEKLY_PREFERENCE_VALUES.map((value) => <SelectItem key={value} value={value}>{WEEKLY_PREFERENCES[value].label}</SelectItem>)}</SelectContent></Select><p className="mt-4 text-sm leading-relaxed text-zinc-400">{WEEKLY_PREFERENCES[weeklyPreference].description}</p><div className="mt-4 border-t border-white/[0.08] pt-4"><p className="text-xs font-medium uppercase tracking-widest text-zinc-500">Estimated Grocery Budget</p><p className="mt-1 text-lg font-semibold text-emerald-300">{WEEKLY_PREFERENCES[weeklyPreference].budget}</p></div></div><button type="button" onClick={handleCreatePlan} disabled={isCreating} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-3 font-semibold text-white transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100">{isCreating ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> : <CalendarPlus className="h-5 w-5" aria-hidden="true" />}{isCreating ? "Preparing meals..." : "Generate My Week"}</button>{createMessage ? <p className={`mt-4 text-sm ${createMessage.type === "success" ? "text-emerald-400" : "text-rose-400"}`} role={createMessage.type === "error" ? "alert" : "status"}>{createMessage.text}</p> : null}</section> : <>
      {(plan.status === "draft" || plan.status === "prepared_for_review") ? <section className="flex flex-col gap-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-emerald-100">Your week is ready for review</h2><p className="mt-1 text-sm text-emerald-100/70">Regenerate this unapproved week with its saved preference, or approve it to prepare the grocery basket.</p></div><div className="flex flex-col gap-2 sm:flex-row"><button type="button" onClick={handleCreatePlan} disabled={isCreating} className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300/40 px-5 py-3 font-semibold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-70">{isCreating ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> : <CalendarPlus className="h-5 w-5" aria-hidden="true" />}{isCreating ? "Regenerating..." : "Regenerate Week"}</button><button type="button" onClick={handleApprovePlan} disabled={isApproving || plan.status !== "prepared_for_review"} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-70">{isApproving ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-5 w-5" aria-hidden="true" />}{isApproving ? "Approving..." : "Approve Week"}</button></div>{createMessage ? <p className={`text-sm ${createMessage.type === "success" ? "text-emerald-200" : "text-rose-300"}`} role={createMessage.type === "error" ? "alert" : "status"}>{createMessage.text}</p> : null}</section> : null}
      <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-7"><div className="mb-6 flex items-center gap-3"><div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-300"><Plus className="h-5 w-5" aria-hidden="true" /></div><div><h2 className="text-lg font-semibold text-white">Add a meal slot</h2><p className="text-sm text-zinc-400">Build a flexible plan around your real week.</p></div></div><form className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" noValidate onSubmit={handleSubmit(onSubmit)}>
        <ProfileField label="Date" htmlFor="meal_date" error={errors.meal_date?.message}><input {...register("meal_date")} id="meal_date" type="date" min={weekStartDate} max={getWeekEnd(weekStartDate)} className={inputClassName} /></ProfileField>
        <ProfileField label="Meal category" htmlFor="meal_category_id" error={errors.meal_category_id?.message}><Controller name="meal_category_id" control={control} render={({ field }) => <Select value={field.value || undefined} onValueChange={field.onChange}><SelectTrigger id="meal_category_id"><SelectValue placeholder="Select a category" /></SelectTrigger><SelectContent>{mealCategories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent></Select>} /></ProfileField>
        <ProfileField label="Slot type" htmlFor="meal_slot_type_id" error={errors.meal_slot_type_id?.message}><Controller name="meal_slot_type_id" control={control} render={({ field }) => <Select value={field.value || undefined} onValueChange={field.onChange}><SelectTrigger id="meal_slot_type_id"><SelectValue placeholder="Select a slot type" /></SelectTrigger><SelectContent>{mealSlotTypes.map((slotType) => <SelectItem key={slotType.id} value={slotType.id}>{slotType.name}</SelectItem>)}</SelectContent></Select>} /></ProfileField>
        {selectedSlotType?.requires_recipe ? <ProfileField label="Recipe" htmlFor="recipe_id" error={errors.recipe_id?.message}><Controller name="recipe_id" control={control} render={({ field }) => <Select value={field.value || undefined} onValueChange={field.onChange} disabled={recipes.length === 0}><SelectTrigger id="recipe_id"><SelectValue placeholder={recipes.length === 0 ? "No recipes available yet" : "Select a recipe"} /></SelectTrigger><SelectContent>{recipes.map((recipe) => <SelectItem key={recipe.id} value={recipe.id}>{recipe.name}</SelectItem>)}</SelectContent></Select>} /></ProfileField> : <ProfileField label="Title (optional)" htmlFor="title" error={errors.title?.message}><input {...register("title")} id="title" placeholder="e.g. Team lunch" className={inputClassName} /></ProfileField>}
        <ProfileField label="Servings (optional)" htmlFor="servings" error={errors.servings?.message}><input {...register("servings", { setValueAs: (value: string) => value === "" ? null : Number(value) })} id="servings" type="number" min="1" step="0.5" className={inputClassName} /></ProfileField>
        <ProfileField label="Notes (optional)" htmlFor="notes" error={errors.notes?.message}><input {...register("notes")} id="notes" placeholder="Any helpful context" className={inputClassName} /></ProfileField>
        <input type="hidden" {...register("meal_plan_id")} />
        <div className="sm:col-span-2 lg:col-span-3 flex flex-col gap-3 border-t border-white/[0.08] pt-5 sm:flex-row sm:items-center sm:justify-between">{itemMessage ? <p className={`flex items-center gap-2 text-sm ${itemMessage.type === "success" ? "text-emerald-400" : "text-rose-400"}`} role={itemMessage.type === "error" ? "alert" : "status"}>{itemMessage.type === "success" ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : null}{itemMessage.text}</p> : <span />}{<button type="submit" disabled={isSubmitting || (selectedSlotType?.requires_recipe === true && recipes.length === 0)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-3 font-semibold text-white transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100">{isSubmitting ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Plus className="h-5 w-5" aria-hidden="true" />}{isSubmitting ? "Adding..." : "Add meal slot"}</button>}</div>
      </form></section>
      <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-7"><div className="mb-6 flex items-center gap-3"><div className="rounded-xl bg-cyan-500/10 p-2 text-cyan-300"><Utensils className="h-5 w-5" aria-hidden="true" /></div><div><h2 className="text-lg font-semibold text-white">Planned meals</h2><p className="text-sm text-zinc-400">{items.length === 0 ? "No slots yet." : `${items.length} slot${items.length === 1 ? "" : "s"} planned for this week.`}</p></div></div>{items.length === 0 ? <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-zinc-500">Add your first meal slot above.</p> : <div className="space-y-3">{Object.entries(groupedItems).map(([date, dayItems]) => <div key={date} className="rounded-2xl border border-white/[0.06] bg-black/10 p-4"><p className="mb-3 text-sm font-medium text-emerald-300">{new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "short" }).format(new Date(`${date}T00:00:00`))}</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{dayItems.map((item) => <article key={item.id} className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4"><p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{item.meal_category_name} · {item.meal_slot_type_name}</p><h3 className="mt-2 font-medium text-white">{item.recipe_name ?? item.title ?? item.meal_slot_type_name}</h3>{item.servings ? <p className="mt-1 text-sm text-zinc-400">{item.servings} serving{item.servings === 1 ? "" : "s"}</p> : null}{item.notes ? <p className="mt-2 text-sm text-zinc-500">{item.notes}</p> : null}</article>)}</div></div>)}</div>}</section>
    </>}
  </div>;
}
