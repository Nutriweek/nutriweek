"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, ChevronRight, LoaderCircle, Plus, Trash2, Utensils } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Controller, useForm, useWatch, type UseFormReturn } from "react-hook-form";

import MealPreparationScreen from "@/components/meal-plans/MealPreparationScreen";
import ProfileField from "@/components/profile/ProfileField";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addMealPlanItem, deleteMealPlanItem } from "@/lib/meal-plans/actions";
import { formatWeekRange, getUpcomingWeekStart, getWeekEnd, getWeekStart, shiftWeek, type MealSlotSelection } from "@/lib/meal-plans/constants";
import { addMealPlanItemSchema, type AddMealPlanItemInput } from "@/lib/meal-plans/schemas";
import type { MealCategory, MealSlotType, PlannedMealItem, Recipe, WeeklyMealPlan } from "@/lib/meal-plans/types";
import { approveWeeklyPlan, prepareWeeklyPlan } from "@/lib/planning/actions";
import { DEFAULT_WEEKLY_PREFERENCE, WEEKLY_PREFERENCE_VALUES, type WeeklyPreference } from "@/lib/planning/weekly-preferences";

type Props = { weekStartDate: string; availableMealSlots: MealSlotSelection[]; plan: WeeklyMealPlan | null; items: PlannedMealItem[]; mealCategories: MealCategory[]; mealSlotTypes: MealSlotType[]; recipes: Pick<Recipe, "id" | "name" | "servings">[]; recipeMealCategoryIds: Record<string, string[]> };
const inputClass = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-zinc-500 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20";

function preferenceFrom(context: unknown): WeeklyPreference {
  const value = context && typeof context === "object" && !Array.isArray(context) ? (context as Record<string, unknown>).weekly_preference : null;
  return typeof value === "string" && WEEKLY_PREFERENCE_VALUES.includes(value as WeeklyPreference) ? value as WeeklyPreference : DEFAULT_WEEKLY_PREFERENCE;
}

function selectedSlotsFrom(context: unknown, available: MealSlotSelection[]) {
  const stored = context && typeof context === "object" && !Array.isArray(context) ? (context as Record<string, unknown>).selected_meal_slots : null;
  if (!Array.isArray(stored)) return available;
  const allowed = new Set(available.map((slot) => `${slot.meal_date}:${slot.meal_category_slug}`));
  const selected = stored.flatMap((slot) => {
    if (!slot || typeof slot !== "object") return [];
    const data = slot as Record<string, unknown>;
    if (typeof data.meal_date !== "string" || !["breakfast", "lunch", "dinner"].includes(String(data.meal_category_slug))) return [];
    const value = { meal_date: data.meal_date, meal_category_slug: data.meal_category_slug as MealSlotSelection["meal_category_slug"] };
    return allowed.has(`${value.meal_date}:${value.meal_category_slug}`) ? [value] : [];
  });
  return selected.length ? selected : available;
}

function getToday() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function getManualDateBounds(weekStartDate: string) {
  const weekEndDate = getWeekEnd(weekStartDate);
  const earliestDate = weekStartDate === getWeekStart() ? getToday() : weekStartDate;
  return { min: earliestDate > weekStartDate ? earliestDate : weekStartDate, max: weekEndDate };
}

function WeekHeader({ weekStartDate }: { weekStartDate: string }) {
  const currentWeek = getWeekStart();
  const nextWeek = getUpcomingWeekStart();
  return <header className="flex flex-col gap-4 rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><p className="text-sm font-medium uppercase tracking-widest text-emerald-400/80">Weekly meal plan</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{formatWeekRange(weekStartDate)}</h1><p className="mt-2 text-sm text-zinc-400">Meals are planned Monday through Saturday. Sunday is reserved for planning and groceries.</p></div><div className="flex items-center gap-2"><Link href={`/dashboard/meal-plans?week=${currentWeek}`} aria-label="Current week" className={`inline-flex h-10 items-center justify-center rounded-xl border px-3 text-sm font-medium transition ${weekStartDate === currentWeek ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200" : "border-white/10 bg-white/5 text-zinc-300 hover:text-white"}`}>Current</Link><Link href={`/dashboard/meal-plans?week=${nextWeek}`} aria-label="Next week" className={`inline-flex h-10 items-center justify-center rounded-xl border px-3 text-sm font-medium transition ${weekStartDate === nextWeek ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200" : "border-white/10 bg-white/5 text-zinc-300 hover:text-white"}`}>Next</Link><Link href={`/dashboard/meal-plans?week=${shiftWeek(weekStartDate, -1)}`} aria-label="Previous week" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 transition hover:text-white"><ChevronLeft className="h-5 w-5" /></Link><Link href={`/dashboard/meal-plans?week=${weekStartDate === nextWeek ? nextWeek : shiftWeek(weekStartDate, 1)}`} aria-label="Next week" className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 ${weekStartDate === nextWeek ? "cursor-not-allowed text-zinc-600" : "text-zinc-300 hover:text-white"}`} aria-disabled={weekStartDate === nextWeek} onClick={(event) => { if (weekStartDate === nextWeek) event.preventDefault(); }}><ChevronRight className="h-5 w-5" /></Link></div></header>;
}

export default function MealPlanEditor({ weekStartDate, availableMealSlots, plan, items, mealCategories, recipes, recipeMealCategoryIds }: Props) {
  const router = useRouter();
  const [isPreparing, setIsPreparing] = useState(!plan);
  const [isCreating, setIsCreating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [mealToDelete, setMealToDelete] = useState<PlannedMealItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const preference = preferenceFrom(plan?.generation_context);
  const manualMealCategories = mealCategories.filter((category) => ["snacks", "desserts"].includes(category.slug));
  const manualDateBounds = getManualDateBounds(weekStartDate);
  const form = useForm<AddMealPlanItemInput>({ resolver: zodResolver(addMealPlanItemSchema), defaultValues: { meal_plan_id: plan?.id ?? "", meal_date: manualDateBounds.min, meal_category_id: manualMealCategories[0]?.id ?? "", recipe_id: "", servings: null, notes: "" } });
  const { reset } = form;
  const groupedItems = useMemo(() => items.reduce<Record<string, PlannedMealItem[]>>((groups, item) => ({ ...groups, [item.meal_date]: [...(groups[item.meal_date] ?? []), item] }), {}), [items]);
  const categoryLabels = Object.fromEntries(mealCategories.map((category) => [category.slug, category.name]));

  async function generate(preferenceValue: WeeklyPreference, slots: MealSlotSelection[]) { setMessage(null); setIsCreating(true); const result = await prepareWeeklyPlan({ week_start_date: weekStartDate, weekly_preference: preferenceValue, selected_meal_slots: slots }); setIsCreating(false); setMessage({ type: result.success ? "success" : "error", text: result.message }); if (result.success) { setIsPreparing(false); router.refresh(); } }
  async function approve() { if (!plan) return; setIsApproving(true); const result = await approveWeeklyPlan({ meal_plan_id: plan.id }); setIsApproving(false); setMessage({ type: result.success ? "success" : "error", text: result.message }); if (result.success) router.push(`/dashboard/grocery?week=${weekStartDate}`); }
  async function addSlot(values: AddMealPlanItemInput) { const result = await addMealPlanItem(values); setMessage({ type: result.success ? "success" : "error", text: result.message }); if (result.success) { reset({ ...values, recipe_id: "", servings: null, notes: "" }); router.refresh(); } }
  async function removeMeal() { if (!plan || !mealToDelete) return; setIsDeleting(true); const result = await deleteMealPlanItem({ meal_plan_id: plan.id, meal_plan_item_id: mealToDelete.id }); setIsDeleting(false); setMessage({ type: result.success ? "success" : "error", text: result.message }); setMealToDelete(null); if (result.success) router.refresh(); }

  const mealName = mealToDelete?.recipe_name ?? mealToDelete?.title ?? mealToDelete?.meal_slot_type_name ?? "this meal";
  const mealDay = mealToDelete ? new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "short" }).format(new Date(`${mealToDelete.meal_date}T00:00:00`)) : "";
  const deletionDescription = mealToDelete ? `Remove "${mealName}" from "${mealDay}"?${["approved", "grocery_generated"].includes(plan?.status ?? "") ? " The grocery basket will also be updated." : ""}` : "";
  return <div className="space-y-6"><WeekHeader weekStartDate={weekStartDate} />{isPreparing ? <MealPreparationScreen slots={availableMealSlots} initialSlots={selectedSlotsFrom(plan?.generation_context, availableMealSlots)} categoryLabels={categoryLabels} allowSlotSelection={weekStartDate === getWeekStart()} initialPreference={preference} isGenerating={isCreating} message={message} onGenerate={generate} /> : <>{plan && (plan.status === "draft" || plan.status === "prepared_for_review") ? <section className="flex flex-col gap-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-emerald-100">Your week is ready for review</h2><p className="mt-1 text-sm text-emerald-100/70">Review it, regenerate with different choices, or approve it to prepare the grocery basket.</p></div><div className="flex gap-2"><button type="button" onClick={() => setIsPreparing(true)} className="rounded-xl border border-emerald-300/40 px-5 py-3 font-semibold text-emerald-100">Regenerate Week</button><button type="button" onClick={approve} disabled={isApproving || plan.status !== "prepared_for_review"} className="rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-zinc-950 disabled:opacity-70">{isApproving ? "Approving..." : "Approve Week"}</button></div></section> : null}<PlannedMeals groupedItems={groupedItems} weekStartDate={weekStartDate} onDelete={setMealToDelete} /><ManualAdd form={form} mealCategories={manualMealCategories} recipes={recipes} recipeMealCategoryIds={recipeMealCategoryIds} onSubmit={addSlot} onFormChange={() => setMessage(null)} dateBounds={manualDateBounds} message={message} /></>}<ConfirmationModal open={Boolean(mealToDelete)} title="Remove meal?" description={deletionDescription} confirmText="Remove" cancelText="Cancel" destructive loading={isDeleting} onConfirm={removeMeal} onCancel={() => { if (!isDeleting) setMealToDelete(null); }} /></div>;
}

function PlannedMeals({ groupedItems, weekStartDate, onDelete }: { groupedItems: Record<string, PlannedMealItem[]>; weekStartDate: string; onDelete: (item: PlannedMealItem) => void }) { const allItems = Object.values(groupedItems).flat(); return <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-7"><div className="mb-6 flex items-center gap-3"><Utensils className="h-5 w-5 text-cyan-300" /><div><h2 className="text-lg font-semibold text-white">Planned meals</h2><p className="text-sm text-zinc-400">{allItems.length ? `${allItems.length} slots planned for this week.` : "No slots yet."}</p></div></div>{allItems.length ? <div className="space-y-3">{Object.entries(groupedItems).map(([date, meals]) => <div key={date} className="rounded-2xl border border-white/[0.06] bg-black/10 p-4"><p className="mb-3 text-sm font-medium text-emerald-300">{new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "short" }).format(new Date(`${date}T00:00:00`))}</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{meals.map((item) => <article key={item.id} className="relative rounded-xl border border-white/[0.08] bg-white/[0.04] transition hover:border-emerald-400/40"><Link href={item.recipe_id ? `/dashboard/recipes/${item.recipe_id}?week=${weekStartDate}&mealCategory=${encodeURIComponent(item.meal_category_name)}` : "#"} className="block p-4 pr-12"><p className="text-xs uppercase tracking-wider text-zinc-500">{item.meal_category_name} · {item.meal_slot_type_name}</p><h3 className="mt-2 font-medium text-white">{item.recipe_name ?? item.title ?? item.meal_slot_type_name}</h3>{item.servings ? <p className="mt-1 text-sm text-zinc-400">{item.servings} servings</p> : null}</Link><button type="button" onClick={() => onDelete(item)} aria-label={`Remove ${item.recipe_name ?? item.title ?? item.meal_slot_type_name}`} className="absolute right-2 top-2 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-zinc-500 transition hover:bg-rose-500/10 hover:text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-300/40"><Trash2 className="h-4 w-4" aria-hidden="true" /></button></article>)}</div></div>)}</div> : <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-zinc-500">Add your first meal slot below.</p>}</section>; }

function ManualAdd({ form, mealCategories, recipes, recipeMealCategoryIds, onSubmit, onFormChange, dateBounds, message }: { form: UseFormReturn<AddMealPlanItemInput>; mealCategories: MealCategory[]; recipes: Pick<Recipe, "id" | "name" | "servings">[]; recipeMealCategoryIds: Record<string, string[]>; onSubmit: (values: AddMealPlanItemInput) => void; onFormChange: () => void; dateBounds: { min: string; max: string }; message: { type: "success" | "error"; text: string } | null }) {
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = form;
  const selectedCategoryId = useWatch({ control, name: "meal_category_id" });
  const compatibleRecipes = recipes.filter((recipe) => recipeMealCategoryIds[recipe.id]?.includes(selectedCategoryId));
  const categoryLabel = mealCategories.find((category) => category.id === selectedCategoryId)?.slug === "desserts" ? "Dessert" : "Snack";
  const dateField = register("meal_date");
  const recipeError = errors.recipe_id ? "Please select a recipe." : undefined;
  return <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-7"><div className="mb-6 flex items-center gap-3"><Plus className="h-5 w-5 text-emerald-300" /><div><h2 className="text-lg font-semibold text-white">Add a meal slot</h2><p className="text-sm text-zinc-400">Add an extra Snack or Dessert recipe to this week.</p></div></div><form className="grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}><ProfileField label="Date" htmlFor="meal_date" error={errors.meal_date?.message}><input {...dateField} onChange={(event) => { dateField.onChange(event); form.clearErrors("meal_date"); onFormChange(); }} id="meal_date" type="date" min={dateBounds.min} max={dateBounds.max} className={inputClass} /></ProfileField><ProfileField label="Meal category" htmlFor="meal_category_id" error={errors.meal_category_id?.message}><Controller name="meal_category_id" control={control} render={({ field }) => <Select value={field.value || undefined} onValueChange={(value) => { field.onChange(value); form.setValue("recipe_id", ""); form.clearErrors("recipe_id"); onFormChange(); }}><SelectTrigger id="meal_category_id"><SelectValue placeholder="Select Snack or Dessert" /></SelectTrigger><SelectContent>{mealCategories.map((category) => <SelectItem key={category.id} value={category.id}>{category.slug === "snacks" ? "Snack" : "Dessert"}</SelectItem>)}</SelectContent></Select>} /></ProfileField><ProfileField label="Recipe" htmlFor="recipe_id" error={recipeError}><Controller name="recipe_id" control={control} render={({ field }) => <Select value={field.value || undefined} onValueChange={(value) => { field.onChange(value); form.clearErrors("recipe_id"); onFormChange(); }}><SelectTrigger id="recipe_id"><SelectValue placeholder={`Select a ${categoryLabel} recipe`} /></SelectTrigger><SelectContent>{compatibleRecipes.length > 0 ? compatibleRecipes.map((recipe) => <SelectItem key={recipe.id} value={recipe.id}>{recipe.name}</SelectItem>) : <p className="px-3 py-2 text-sm text-zinc-500">No {categoryLabel.toLowerCase()} recipes are available yet.</p>}</SelectContent></Select>} /></ProfileField><ProfileField label="Servings" htmlFor="servings" error={errors.servings?.message}><input {...register("servings", { setValueAs: (value: string) => value === "" ? null : Number(value) })} id="servings" type="number" min="1" className={inputClass} /></ProfileField><ProfileField label="Notes (optional)" htmlFor="notes" error={errors.notes?.message}><input {...register("notes")} id="notes" className={inputClass} /></ProfileField><input type="hidden" {...register("meal_plan_id")} /><div className="flex items-center justify-between gap-3 sm:col-span-2">{message ? <p className={message.type === "success" ? "text-sm text-emerald-400" : "text-sm text-rose-400"}>{message.text}</p> : <span />}<button type="submit" disabled={isSubmitting || compatibleRecipes.length === 0} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-3 font-semibold text-white disabled:opacity-70">{isSubmitting ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}Add meal slot</button></div></form></section>;
}
