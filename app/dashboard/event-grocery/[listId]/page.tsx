import { notFound } from "next/navigation";

import EventGroceryListEditor from "@/components/event-grocery/EventGroceryListEditor";
import { createClient } from "@/lib/supabase/server";

type EventGroceryDetailPageProps = { params: Promise<{ listId: string }> };

export default async function EventGroceryDetailPage({ params }: EventGroceryDetailPageProps) {
  const { listId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in to view this event grocery list.");
  const [{ data: list, error: listError }, { data: catalog, error: catalogError }, { data: items, error: itemsError }, { data: firstCompletedOrder, error: completedOrderError }] = await Promise.all([
    supabase.from("event_grocery_lists").select("id, name").eq("id", listId).eq("user_id", user.id).maybeSingle(),
    supabase.from("event_grocery_catalog_items").select("id, name").eq("is_active", true).order("display_order"),
    supabase.from("event_grocery_items").select("id, catalog_item_id, quantity, unit, event_grocery_catalog_items!inner(name)").eq("list_id", listId).order("created_at"),
    supabase.from("checkout_sessions").select("completed_at, selected_grocery_item_ids, selected_shopping_provider_id").eq("event_grocery_list_id", listId).eq("status", "completed").order("completed_at", { ascending: true }).limit(1).maybeSingle(),
  ]);
  if (listError || catalogError || itemsError || completedOrderError) throw new Error("Unable to load this event grocery list.");
  if (!list) notFound();
  const { data: provider, error: providerError } = firstCompletedOrder?.selected_shopping_provider_id
    ? await supabase.from("shopping_providers").select("name").eq("id", firstCompletedOrder.selected_shopping_provider_id).maybeSingle()
    : { data: null, error: null };
  if (providerError) throw new Error("Unable to load the event grocery purchase details.");
  const editorItems = (items ?? []).map((item) => {
    const catalogItem = item.event_grocery_catalog_items as unknown;
    const catalogName = Array.isArray(catalogItem) ? catalogItem[0]?.name : (catalogItem as { name?: string } | null)?.name;
    if (!catalogName) throw new Error("Unable to resolve an event grocery catalog item.");
    return { id: item.id, catalogItemId: item.catalog_item_id, quantity: Number(item.quantity), unit: item.unit as "kg" | "g" | "litre" | "ml" | "packet" | "box" | "bottle" | "piece" | "dozen", name: catalogName };
  });
  return <EventGroceryListEditor listId={list.id} name={list.name} catalog={catalog ?? []} items={editorItems} purchase={firstCompletedOrder?.completed_at ? { providerName: provider?.name ?? "Shopping provider", completedAt: firstCompletedOrder.completed_at, itemCount: firstCompletedOrder.selected_grocery_item_ids.length } : null} />;
}
