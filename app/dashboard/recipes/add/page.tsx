import RecipeLibrary from "@/components/recipes/RecipeLibrary";
import { getRecipeEditorData } from "@/lib/recipes";

export default async function AddRecipePage() {
  const editorData = await getRecipeEditorData();
  return <RecipeLibrary recipes={[]} initialSearch="" authoring {...editorData} />;
}
