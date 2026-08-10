import EventGroceryListIndex from "@/components/event-grocery/EventGroceryListIndex";
import { createClient } from "@/lib/supabase/server";

export default async function EventGroceryListsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in to view your event grocery lists.");
  const { data: lists, error } = await supabase.from("event_grocery_lists").select("id, name, updated_at, event_grocery_items(id)").eq("user_id", user.id).order("updated_at", { ascending: false });
  if (error) throw new Error("Unable to load your event grocery lists.");
  const listIds = (lists ?? []).map((list) => list.id);
  const { data: completedOrders, error: completedOrdersError } = listIds.length > 0
    ? await supabase.from("checkout_sessions").select("event_grocery_list_id, completed_at").in("event_grocery_list_id", listIds).eq("status", "completed").order("completed_at", { ascending: true })
    : { data: [], error: null };
  if (completedOrdersError) throw new Error("Unable to load event grocery purchase statuses.");
  const firstPurchaseByListId = new Map<string, string>();
  for (const order of completedOrders ?? []) {
    if (order.event_grocery_list_id && order.completed_at && !firstPurchaseByListId.has(order.event_grocery_list_id)) firstPurchaseByListId.set(order.event_grocery_list_id, order.completed_at);
  }
  return <section className="space-y-6" aria-labelledby="event-grocery-heading"><div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-xl"><p className="text-sm font-medium uppercase tracking-widest text-emerald-400/80">Occasion shopping</p><h1 id="event-grocery-heading" className="mt-2 text-3xl font-semibold tracking-tight text-white">Event Grocery Lists</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">Organize wedding, festival, family function, and party shopping separately from your weekly meal plan.</p></div><EventGroceryListIndex lists={(lists ?? []).map((list) => ({ id: list.id, name: list.name, updatedAt: list.updated_at, itemCount: list.event_grocery_items.length, purchasedAt: firstPurchaseByListId.get(list.id) ?? null }))} /></section>;
}
