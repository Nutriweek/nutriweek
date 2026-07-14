import RecipeLibrary from "@/components/recipes/RecipeLibrary";
import { getRecipeCatalog, getRecipeEditorData } from "@/lib/recipes";

type RecipesPageProps = { searchParams: Promise<{ q?: string }> };

export default async function RecipesPage({ searchParams }: RecipesPageProps) {
  const { q } = await searchParams;
  const search = q ?? "";
  const [recipes, editorData] = await Promise.all([getRecipeCatalog(search), getRecipeEditorData()]);
  return <RecipeLibrary recipes={recipes} initialSearch={search} {...editorData} />;
}
