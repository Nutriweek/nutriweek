"use client";

import { LoaderCircle } from "lucide-react";

import SearchableCombobox from "@/components/ui/SearchableCombobox";
import type { PlannedMealItem, Recipe } from "@/lib/meal-plans/types";

type Props = {
  item: PlannedMealItem;
  recipes: Pick<Recipe, "id" | "name" | "servings">[];
  recipeMealCategoryIds: Record<string, string[]>;
  selectedRecipeId: string;
  onSelectRecipe: (recipeId: string) => void;
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
};

export default function RecipeReplacement({ item, recipes, recipeMealCategoryIds, selectedRecipeId, onSelectRecipe, onCancel, onSave, isSaving }: Props) {
  const compatibleRecipes = recipes.filter((recipe) => recipeMealCategoryIds[recipe.id]?.includes(item.meal_category_id));
  return <div className="p-4"><p className="text-xs uppercase tracking-wider text-zinc-500">{item.meal_category_name} · Replace recipe</p><div className="mt-3"><SearchableCombobox options={compatibleRecipes.map((recipe) => ({ value: recipe.id, label: recipe.name }))} value={selectedRecipeId} onValueChange={onSelectRecipe} placeholder="Choose a recipe" searchPlaceholder={`Search ${item.meal_category_name.toLowerCase()} recipes...`} emptyMessage={`No ${item.meal_category_name.toLowerCase()} recipes found.`} ariaLabel={`Replace ${item.recipe_name ?? item.meal_category_name} recipe`} /></div><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={onCancel} disabled={isSaving} className="rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-zinc-300 transition hover:text-white disabled:opacity-60">Cancel</button><button type="button" onClick={onSave} disabled={!selectedRecipeId || isSaving} className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-3 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300 disabled:opacity-60">{isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}Save</button></div></div>;
}
