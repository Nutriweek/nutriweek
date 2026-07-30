import { ArrowLeft, Check, Clock3, CookingPot, Lightbulb, PlayCircle, Timer, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import RecipeCoverImage from "@/components/recipes/RecipeCoverImage";
import { getRecipeDetails } from "@/lib/recipes";

type RecipeDetailsPageProps = {
  params: Promise<{ recipeId: string }>;
  searchParams: Promise<{ week?: string; mealCategory?: string }>;
};

const nutritionItems = ["Calories", "Protein", "Carbs", "Fat"];

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

  const backHref = week ? `/dashboard/meal-plans?week=${encodeURIComponent(week)}` : "/dashboard/recipes";
  const backLabel = week ? "Back to Meal Plan" : "Back to Recipes";
  const displayedCategory = mealCategory || details.mealCategories[0] || "Recipe";
  const overview = [
    ["Cuisine", details.cuisine, CookingPot],
    ["Difficulty", details.recipe.difficulty, Clock3],
    ["Preparation", details.recipe.prep_time_minutes === null ? null : `${details.recipe.prep_time_minutes} min`, Clock3],
    ["Cooking", details.recipe.cook_time_minutes === null ? null : `${details.recipe.cook_time_minutes} min`, Timer],
    ["Total time", details.recipe.total_time_minutes === null ? null : `${details.recipe.total_time_minutes} min`, Timer],
    ["Servings", details.recipe.servings === null ? null : formatNumber(details.recipe.servings), Users],
  ].filter((item): item is [string, string, typeof Clock3] => item[1] !== null);

  return <div className="mx-auto max-w-6xl space-y-6 pb-10">
    <header className="flex items-center justify-between gap-4"><Link href={backHref} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-emerald-400/50 hover:text-white"><ArrowLeft className="h-4 w-4" aria-hidden="true" />{backLabel}</Link></header>

    <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <RecipeCoverImage imagePath={details.recipe.cover_image_path} recipeName={details.recipe.name} className="min-h-64 lg:min-h-[30rem]" />
      <div className="flex flex-col justify-center p-6 sm:p-9"><p className="text-sm font-medium uppercase tracking-widest text-emerald-400/80">{displayedCategory}</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">{details.recipe.name}</h1>{details.recipe.description ? <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-400">{details.recipe.description}</p> : <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-500">A Nutriweek recipe made to fit naturally into your week.</p>}<div className="mt-7 flex flex-wrap gap-2">{details.mealCategories.map((category) => <span key={category} className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-100">{category}</span>)}{details.tags.slice(0, 3).map((tag) => <span key={tag.id} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-zinc-300">{tag.name}</span>)}</div></div>
    </section>

    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-7" aria-labelledby="recipe-overview-heading"><h2 id="recipe-overview-heading" className="text-xl font-semibold text-white">At a glance</h2><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">{overview.map(([label, value, Icon]) => <div key={label} className="rounded-2xl border border-white/[0.08] bg-black/15 p-4"><p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</p><p className="mt-2 flex items-center gap-2 font-medium text-white"><Icon className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />{value}</p></div>)}</div></section>

    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-7" aria-labelledby="ingredients-heading"><h2 id="ingredients-heading" className="text-xl font-semibold text-white">Ingredients</h2><p className="mt-1 text-sm text-zinc-400">Everything you need, ready to check as you cook.</p>{details.ingredients.length ? <ul className="mt-5 space-y-3">{details.ingredients.map((ingredient) => <li key={ingredient.id} className="flex gap-3 rounded-2xl border border-white/[0.08] bg-black/15 px-4 py-3 text-zinc-200"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-emerald-300/50 text-emerald-300" aria-hidden="true"><Check className="h-3.5 w-3.5 opacity-0" /></span><span className="leading-relaxed">{formatIngredient(ingredient.quantity, ingredient.unit, ingredient.name)}{ingredient.preparationNote ? <span className="text-zinc-400">, {ingredient.preparationNote}</span> : null}{ingredient.isOptional ? <span className="text-zinc-500"> (optional)</span> : null}</span></li>)}</ul> : <p className="mt-4 text-sm text-zinc-500">Ingredients have not been added for this recipe yet.</p>}</section>

      <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-7" aria-labelledby="instructions-heading"><h2 id="instructions-heading" className="text-xl font-semibold text-white">Step-by-step cooking</h2><p className="mt-1 text-sm text-zinc-400">Take it one step at a time.</p>{details.steps.length ? <ol className="mt-5 space-y-4">{details.steps.map((step) => <li key={step.id} className="flex gap-4 rounded-2xl border border-white/[0.08] bg-black/15 p-4 sm:p-5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-base font-semibold text-zinc-950">{step.stepNumber}</span><div><p className="whitespace-pre-wrap text-base leading-relaxed text-zinc-100">{step.instruction}</p>{step.tip ? <p className="mt-3 rounded-xl border border-emerald-400/15 bg-emerald-500/[0.06] px-3 py-2 text-sm leading-relaxed text-emerald-100/85">Tip: {step.tip}</p> : null}</div></li>)}</ol> : <p className="mt-4 text-sm text-zinc-500">Instructions have not been added for this recipe yet.</p>}</section>
    </div>

    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-7" aria-labelledby="nutrition-heading"><h2 id="nutrition-heading" className="text-xl font-semibold text-white">Nutrition</h2><p className="mt-1 text-sm text-zinc-400">Nutrition insights are coming soon.</p><dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{nutritionItems.map((label) => <div key={label} className="rounded-2xl border border-white/[0.08] bg-black/15 p-4"><dt className="text-sm text-zinc-400">{label}</dt><dd className="mt-1 text-lg font-semibold text-zinc-500">—</dd></div>)}</dl></section>

    <div className="grid gap-6 md:grid-cols-2">
      <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-7" aria-labelledby="tips-heading"><div className="flex items-center gap-3"><span className="rounded-xl bg-amber-400/10 p-2 text-amber-200"><Lightbulb className="h-5 w-5" aria-hidden="true" /></span><h2 id="tips-heading" className="text-xl font-semibold text-white">Cooking Tips</h2></div><p className="mt-4 leading-relaxed text-zinc-400">Helpful preparation notes and chef tips will appear here in a future release.</p></section>
      <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-7" aria-labelledby="video-heading"><div className="flex items-center gap-3"><span className="rounded-xl bg-cyan-400/10 p-2 text-cyan-200"><PlayCircle className="h-5 w-5" aria-hidden="true" /></span><h2 id="video-heading" className="text-xl font-semibold text-white">Cooking Video</h2></div><p className="mt-4 leading-relaxed text-zinc-400">Video coming soon.</p><p className="mt-2 text-sm text-zinc-500">This space is ready for curated YouTube or Nutriweek-hosted cooking videos.</p></section>
    </div>
  </div>;
}
