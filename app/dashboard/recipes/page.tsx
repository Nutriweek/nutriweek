import RecipeLibrary from "@/components/recipes/RecipeLibrary";
import { getRecipeCatalog } from "@/lib/recipes";

type RecipesPageProps = { searchParams: Promise<{ q?: string; tab?: string }> };

export default async function RecipesPage({ searchParams }: RecipesPageProps) {
  const { q, tab } = await searchParams;
  const search = q ?? "";
  const activeTab = tab === "nutriweek" || tab === "mine" ? tab : "all";
  const recipes = await getRecipeCatalog(search, activeTab);
  return <RecipeLibrary recipes={recipes} initialSearch={search} activeTab={activeTab} />;
}
