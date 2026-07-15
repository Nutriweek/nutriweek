import PantryManager from "@/components/pantry/PantryManager";
import { createClient } from "@/lib/supabase/server";

type PantryRow = {
  id: string;
  ingredient_id: string;
  available: boolean;
};

export default async function PantryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in to view your pantry.");

  const { data: membership, error: membershipError } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (membershipError || !membership) throw new Error("Your household is not available yet. Please refresh and try again.");

  const [{ data: pantryRows, error: pantryError }, { data: ingredients, error: ingredientsError }] = await Promise.all([
    supabase.from("pantry_items").select("id, ingredient_id, available").eq("household_id", membership.household_id).order("updated_at", { ascending: false }),
    supabase.from("ingredients").select("id, name").eq("is_active", true).order("name"),
  ]);
  if (pantryError || ingredientsError) throw new Error("Unable to load your Kitchen Pantry.");

  const ingredientNames = new Map((ingredients ?? []).map((ingredient) => [ingredient.id, ingredient.name]));
  const pantryItems = ((pantryRows ?? []) as PantryRow[]).map((item) => ({
    id: item.id,
    ingredientId: item.ingredient_id,
    name: ingredientNames.get(item.ingredient_id) ?? "Catalog ingredient",
    available: item.available,
  }));

  return <section className="space-y-6" aria-labelledby="pantry-heading">
    <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-xl">
      <p className="text-sm font-medium uppercase tracking-widest text-emerald-400/80">Kitchen Pantry</p>
      <h1 id="pantry-heading" className="mt-2 text-3xl font-semibold tracking-tight text-white">Kitchen Pantry</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">Tell Nutriweek what you already have. Available ingredients are skipped from grocery shopping without managing quantities or expiry dates.</p>
    </div>
    <PantryManager ingredients={(ingredients ?? []).map((ingredient) => ({ id: ingredient.id, name: ingredient.name }))} pantryItems={pantryItems} />
  </section>;
}
