"use client";

import { CirclePlus, Clock3, Search, Users, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import RecipeCoverImage from "@/components/recipes/RecipeCoverImage";
import type { RecipeCatalogItem } from "@/lib/recipes/types";

type Props = {
  recipes: RecipeCatalogItem[];
  initialSearch: string;
  activeTab: "all" | "nutriweek" | "mine";
};

const input = "w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-emerald-400";

export default function RecipeLibrary({ recipes, initialSearch, activeTab }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [comingSoonOpen, setComingSoonOpen] = useState(false);

  function navigate(tab = activeTab, term = search) {
    const params = new URLSearchParams();
    if (tab !== "all") params.set("tab", tab);
    if (term.trim()) params.set("q", term.trim());
    router.push(`/dashboard/recipes${params.size ? `?${params}` : ""}`);
  }

  return <>
    <div className="space-y-6">
      <section className="flex flex-col gap-5 rounded-3xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
        <div><p className="text-sm font-medium uppercase tracking-widest text-emerald-400/80">Recipe library</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Recipes built for real weeks</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">Browse Nutriweek recipes or keep your own private recipes in one place.</p></div>
        <button type="button" onClick={() => setComingSoonOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-3 font-semibold text-white transition hover:brightness-110"><CirclePlus className="h-5 w-5" aria-hidden="true" />Add recipe</button>
      </section>

      <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-7"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex gap-2" role="tablist" aria-label="Recipe source">{([['all', 'All'], ['nutriweek', 'Nutriweek'], ['mine', 'My Recipes']] as const).map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={activeTab === key} onClick={() => navigate(key)} className={`rounded-xl px-4 py-2 text-sm font-medium transition ${activeTab === key ? "bg-emerald-500 text-zinc-950" : "bg-white/5 text-zinc-300 hover:bg-white/10"}`}>{label}</button>)}</div><h2 className="mt-5 text-xl font-semibold text-white">Recipe catalog</h2></div><form onSubmit={(event) => { event.preventDefault(); navigate(); }} className="flex w-full gap-2 sm:max-w-md"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search recipes" className={input} /><button className="rounded-xl border border-white/10 px-4 text-emerald-300 transition hover:bg-white/5" aria-label="Search recipes"><Search className="h-5 w-5" aria-hidden="true" /></button></form></div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{recipes.map((recipe) => <Link key={recipe.id} href={`/dashboard/recipes/${recipe.id}`} className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-black/15 text-left transition hover:border-emerald-400/40 hover:bg-emerald-500/[0.05] focus:outline-none focus:ring-2 focus:ring-emerald-300/60"><RecipeCoverImage imagePath={recipe.cover_image_path} recipeName={recipe.name} className="h-32" /><div className="p-5"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold text-white group-hover:text-emerald-100">{recipe.name}</h3>{recipe.source_type === "system" ? <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-200">Nutriweek</span> : <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-200">My Recipe</span>}</div>{recipe.description && <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{recipe.description}</p>}<p className="mt-4 flex items-center gap-2 text-sm text-zinc-500"><Clock3 className="h-4 w-4" aria-hidden="true" />{recipe.total_time_minutes ? `${recipe.total_time_minutes} min` : "Time not set"}{recipe.servings ? <><span aria-hidden="true">·</span><Users className="h-4 w-4" aria-hidden="true" />{recipe.servings}</> : null}</p></div></Link>)}{recipes.length === 0 && <div className="col-span-full rounded-2xl border border-dashed border-white/10 py-12 text-center text-zinc-400">No recipes found. <button type="button" onClick={() => setComingSoonOpen(true)} className="font-medium text-emerald-300 hover:text-emerald-200">Add your first recipe.</button></div>}</div>
      </section>
    </div>

    {comingSoonOpen ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="personal-recipes-title"><div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium uppercase tracking-widest text-emerald-400/80">Personal Recipes</p><h2 id="personal-recipes-title" className="mt-2 text-2xl font-semibold text-white">Coming Soon</h2></div><button type="button" onClick={() => setComingSoonOpen(false)} className="rounded-xl p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white" aria-label="Close personal recipes dialog"><X className="h-5 w-5" aria-hidden="true" /></button></div><p className="mt-5 leading-relaxed text-zinc-400">In a future release you&apos;ll be able to create and manage your own private recipes while continuing to use Nutriweek&apos;s curated recipe library.</p><button type="button" onClick={() => setComingSoonOpen(false)} className="mt-7 w-full rounded-xl bg-emerald-500 px-4 py-2.5 font-semibold text-zinc-950 transition hover:bg-emerald-400">Got it</button></div></div> : null}
  </>;
}
