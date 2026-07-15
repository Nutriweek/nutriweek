import { ArrowLeft, ChefHat, Clock3, CookingPot, Timer, Users, Wrench } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getRecipeDetails } from "@/lib/recipes";

type RecipeDetailsPageProps = {
  params: Promise<{ recipeId: string }>;
  searchParams: Promise<{ week?: string; mealCategory?: string }>;
};

const nutritionItems = [
  ["Calories", "calories_kcal", "kcal"], ["Protein", "protein_g", "g"], ["Carbohydrates", "carbohydrates_g", "g"], ["Fat", "fat_g", "g"],
  ["Fibre", "fiber_g", "g"], ["Sugar", "sugar_g", "g"], ["Sodium", "sodium_mg", "mg"],
] as const;

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}

function formatIngredient(quantity: number | null, unit: string | null, name: string) {
  return [quantity === null ? "" : formatNumber(quantity), unit?.trim() ?? "", name].filter(Boolean).join(" ");
}

export default async function RecipeDetailsPage({ params, searchParams }: RecipeDetailsPageProps) {
  const [{ recipeId }, { week, mealCategory }] = await Promise.all([params, searchParams]);
  const details = await getRecipeDetails(recipeId);
  if (!details) notFound();

  const backHref = week ? `/dashboard/meal-plans?week=${encodeURIComponent(week)}` : "/dashboard/meal-plans";
  const displayedCategory = mealCategory || details.mealCategories[0] || "Meal";
  const nutrition = nutritionItems.flatMap(([label, field, unit]) => {
    const value = details.recipe[field];
    return value === null ? [] : [{ label, value: `${formatNumber(value)} ${unit}` }];
  });
  const overview = [
    ["Cuisine", details.cuisine], ["Difficulty", details.recipe.difficulty],
    ["Preparation", details.recipe.prep_time_minutes === null ? null : `${details.recipe.prep_time_minutes} min`],
    ["Cooking", details.recipe.cook_time_minutes === null ? null : `${details.recipe.cook_time_minutes} min`],
    ["Total time", details.recipe.total_time_minutes === null ? null : `${details.recipe.total_time_minutes} min`],
    ["Servings", details.recipe.servings === null ? null : formatNumber(details.recipe.servings)],
  ].filter((item): item is [string, string] => item[1] !== null);

  return <div className="mx-auto max-w-5xl space-y-6 pb-8">
    <header className="flex flex-col gap-4 rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-xl sm:flex-row sm:items-start sm:justify-between sm:p-7">
      <div><p className="text-sm font-medium uppercase tracking-widest text-emerald-400/80">{displayedCategory}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{details.recipe.name}</h1>{details.recipe.description ? <p className="mt-3 max-w-2xl leading-relaxed text-zinc-400">{details.recipe.description}</p> : null}</div>
      <Link href={backHref} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-emerald-400/50 hover:text-white" aria-label="Back to meal plan"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back to Meal Plan</Link>
    </header>

    <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.04]" aria-label={`${details.recipe.name} image`}>
      {details.recipe.cover_image_path ? <div className="h-64 bg-cover bg-center sm:h-80" style={{ backgroundImage: `url("${details.recipe.cover_image_path}")` }} role="img" aria-label={`Photo of ${details.recipe.name}`} /> : <div className="flex h-64 flex-col items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.22),_transparent_42%),linear-gradient(135deg,_rgba(8,47,73,0.8),_rgba(9,9,11,0.9))] sm:h-80"><div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-emerald-200"><ChefHat className="h-10 w-10" aria-hidden="true" /></div><p className="mt-4 text-sm font-medium text-emerald-100/80">Nutriweek recipe</p></div>}
    </section>

    {overview.length ? <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-7" aria-labelledby="recipe-overview-heading"><h2 id="recipe-overview-heading" className="text-xl font-semibold text-white">Recipe overview</h2><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">{overview.map(([label, value]) => <div key={label} className="rounded-2xl border border-white/[0.08] bg-black/15 p-4"><p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</p><p className="mt-2 flex items-center gap-2 font-medium text-white">{label === "Servings" ? <Users className="h-4 w-4 text-emerald-300" aria-hidden="true" /> : label === "Cuisine" ? <CookingPot className="h-4 w-4 text-emerald-300" aria-hidden="true" /> : label === "Total time" ? <Timer className="h-4 w-4 text-emerald-300" aria-hidden="true" /> : <Clock3 className="h-4 w-4 text-emerald-300" aria-hidden="true" />}{value}</p></div>)}</div></section> : null}

    {nutrition.length ? <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-7" aria-labelledby="nutrition-heading"><h2 id="nutrition-heading" className="text-xl font-semibold text-white">Nutrition</h2><p className="mt-1 text-sm text-zinc-400">Per serving</p><dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{nutrition.map((item) => <div key={item.label} className="rounded-2xl border border-white/[0.08] bg-black/15 p-4"><dt className="text-sm text-zinc-400">{item.label}</dt><dd className="mt-1 text-lg font-semibold text-emerald-200">{item.value}</dd></div>)}</dl></section> : null}

    {details.tags.length ? <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-7" aria-labelledby="planning-tags-heading"><h2 id="planning-tags-heading" className="text-xl font-semibold text-white">Planning tags</h2><div className="mt-5 flex flex-wrap gap-2">{details.tags.map((tag) => <span key={tag.id} className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-100">{tag.name}</span>)}</div></section> : null}

    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-7" aria-labelledby="ingredients-heading"><h2 id="ingredients-heading" className="text-xl font-semibold text-white">Ingredients</h2>{details.ingredients.length ? <ul className="mt-5 space-y-3">{details.ingredients.map((ingredient) => <li key={ingredient.id} className="flex gap-3 rounded-2xl border border-white/[0.08] bg-black/15 px-4 py-3 text-zinc-200"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-400" aria-hidden="true" /><span>{formatIngredient(ingredient.quantity, ingredient.unit, ingredient.name)}{ingredient.preparationNote ? <span className="text-zinc-400">, {ingredient.preparationNote}</span> : null}{ingredient.isOptional ? <span className="text-zinc-500"> (optional)</span> : null}</span></li>)}</ul> : <p className="mt-4 text-sm text-zinc-500">Ingredients have not been added for this recipe yet.</p>}</section>

    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-7" aria-labelledby="instructions-heading"><h2 id="instructions-heading" className="text-xl font-semibold text-white">Instructions</h2>{details.steps.length ? <ol className="mt-5 space-y-4">{details.steps.map((step) => <li key={step.id} className="flex gap-4 rounded-2xl border border-white/[0.08] bg-black/15 p-4 sm:p-5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-400 font-semibold text-zinc-950">{step.stepNumber}</span><div><p className="leading-relaxed text-zinc-200">{step.instruction}</p>{step.tip ? <p className="mt-3 text-sm leading-relaxed text-emerald-200/80">Tip: {step.tip}</p> : null}</div></li>)}</ol> : <p className="mt-4 text-sm text-zinc-500">Instructions have not been added for this recipe yet.</p>}</section>

    {details.equipment.length ? <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-7" aria-labelledby="equipment-heading"><h2 id="equipment-heading" className="text-xl font-semibold text-white">Equipment</h2><div className="mt-5 flex flex-wrap gap-2">{details.equipment.map((item) => <span key={item} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/15 px-3 py-2 text-sm text-zinc-200"><Wrench className="h-4 w-4 text-emerald-300" aria-hidden="true" />{item}</span>)}</div></section> : null}

    <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-medium text-emerald-300 transition hover:text-emerald-200"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back to Meal Plan</Link>
  </div>;
}
