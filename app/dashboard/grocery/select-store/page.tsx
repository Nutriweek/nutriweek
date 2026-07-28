import { Store } from "lucide-react";

import CheckoutStepper from "@/components/grocery/CheckoutStepper";
import { selectCheckoutSessionProvider } from "@/lib/grocery/checkoutSessions";
import { formatWeekRange } from "@/lib/meal-plans";
import { getShoppingProviders } from "@/lib/shopping-providers/actions";
import { createClient } from "@/lib/supabase/server";

type SelectStorePageProps = { searchParams: Promise<{ session?: string }> };

const providerMetadata: Record<string, string> = {
  blinkit: "10–20 min",
  zepto: "8–15 min",
  swiggy_instamart: "15–25 min",
  bigbasket: "Scheduled Delivery",
  local_store: "Offline Shopping",
};

export default async function SelectStorePage({ searchParams }: SelectStorePageProps) {
  const { session } = await searchParams;
  const supabase = await createClient();
  const [{ data: checkoutSession, error: checkoutSessionError }, providers] = await Promise.all([
    session ? supabase.from("checkout_sessions").select("grocery_list_id, selected_grocery_item_ids").eq("id", session).maybeSingle() : Promise.resolve({ data: null, error: null }),
    getShoppingProviders(),
  ]);
  if (checkoutSessionError || !checkoutSession) throw new Error("Your checkout session is no longer available.");

  const { data: groceryList, error: groceryListError } = await supabase.from("grocery_lists").select("weekly_meal_plan_id").eq("id", checkoutSession.grocery_list_id).maybeSingle();
  if (groceryListError || !groceryList) throw new Error("Unable to load your checkout summary.");

  const { data: mealPlan, error: mealPlanError } = await supabase.from("weekly_meal_plans").select("week_start_date").eq("id", groceryList.weekly_meal_plan_id).maybeSingle();
  if (mealPlanError || !mealPlan) throw new Error("Unable to load your checkout summary.");

  return <section className="mx-auto max-w-5xl space-y-6" aria-labelledby="select-store-heading">
    <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
      <p className="text-sm font-medium uppercase tracking-widest text-emerald-400/80">Shopping provider</p>
      <h1 id="select-store-heading" className="mt-2 text-3xl font-semibold tracking-tight text-white">Select Your Store</h1>
      <p className="mt-2 text-sm text-zinc-400">Select a provider to continue your checkout.</p>
    </div>
    <div className="rounded-3xl border border-emerald-400/15 bg-emerald-500/[0.06] p-5 backdrop-blur-xl sm:flex sm:items-center sm:justify-between sm:p-6">
      <div><p className="text-sm font-medium text-emerald-100">Checkout summary</p><p className="mt-1 text-sm text-zinc-300">Choose where you&apos;d like to buy your groceries.</p></div>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:mt-0 sm:min-w-72"><div className="rounded-xl border border-white/[0.08] bg-black/10 p-3"><dt className="text-xs text-zinc-500">Selected items</dt><dd className="mt-1 text-sm font-semibold text-white">{checkoutSession.selected_grocery_item_ids.length}</dd></div><div className="rounded-xl border border-white/[0.08] bg-black/10 p-3"><dt className="text-xs text-zinc-500">Meal plan week</dt><dd className="mt-1 text-sm font-semibold text-white">{formatWeekRange(mealPlan.week_start_date)}</dd></div></dl>
    </div>
    <CheckoutStepper currentStep={1} />

    {providers.length > 0 ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{providers.map((provider) => <form key={provider.id} action={selectCheckoutSessionProvider}><input type="hidden" name="session" value={session ?? ""} /><input type="hidden" name="provider" value={provider.id} /><button type="submit" className="group w-full rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 text-left transition hover:border-emerald-400/40 hover:bg-emerald-500/[0.08] hover:shadow-lg hover:shadow-emerald-950/20"><div className="flex items-center gap-4">{provider.icon ? <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-2xl" aria-label={`${provider.name} logo`}>{provider.icon}</span> : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300"><Store className="h-6 w-6" aria-hidden="true" /></span>}<div><h2 className="font-semibold text-white group-hover:text-emerald-100">{provider.name}</h2>{providerMetadata[provider.id] ? <p className="mt-1 text-sm text-zinc-400">{providerMetadata[provider.id]}</p> : null}</div></div></button></form>)}</div> : <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-12 text-center text-sm text-zinc-400">No shopping providers are available.</div>}
  </section>;
}
