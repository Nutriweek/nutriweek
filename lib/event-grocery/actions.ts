"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const units = ["kg", "g", "litre", "ml", "packet", "box", "bottle", "piece", "dozen"] as const;
const nameSchema = z.string().trim().min(1, "Enter a list name.").max(120, "Keep the list name under 120 characters.");
const itemSchema = z.object({
  listId: z.string().uuid(),
  catalogItemId: z.string().uuid(),
  quantity: z.number().finite().positive("Quantity must be greater than zero.").max(999999),
  unit: z.enum(units),
});

export type EventGroceryActionResult = { success: boolean; message: string; listId?: string };

async function currentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

async function eventGroceryListIsPurchased(supabase: Awaited<ReturnType<typeof createClient>>, listId: string) {
  const { data, error } = await supabase.from("checkout_sessions").select("id").eq("event_grocery_list_id", listId).eq("status", "completed").limit(1).maybeSingle();
  return { purchased: Boolean(data), error };
}

export async function createEventGroceryList(name: string): Promise<EventGroceryActionResult> {
  const parsed = nameSchema.safeParse(name);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Enter a list name." };
  const { supabase, user } = await currentUser();
  if (!user) return { success: false, message: "Please sign in to create a grocery list." };
  const { data, error } = await supabase.from("event_grocery_lists").insert({ user_id: user.id, name: parsed.data }).select("id").single();
  if (error || !data) return { success: false, message: "We could not create this grocery list." };
  revalidatePath("/dashboard/event-grocery");
  return { success: true, message: "Grocery list created.", listId: data.id };
}

export async function deleteEventGroceryList(listId: string): Promise<EventGroceryActionResult> {
  if (!z.string().uuid().safeParse(listId).success) return { success: false, message: "This grocery list is invalid." };
  const { supabase, user } = await currentUser();
  if (!user) return { success: false, message: "Please sign in to manage grocery lists." };
  const { error } = await supabase.from("event_grocery_lists").delete().eq("id", listId).eq("user_id", user.id);
  if (error) return { success: false, message: "We could not delete this grocery list." };
  revalidatePath("/dashboard/event-grocery");
  return { success: true, message: "Grocery list deleted." };
}

export async function addEventGroceryItem(input: z.infer<typeof itemSchema>): Promise<EventGroceryActionResult> {
  const parsed = itemSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Check the grocery item." };
  const { supabase, user } = await currentUser();
  if (!user) return { success: false, message: "Please sign in to manage grocery lists." };
  const { data: list } = await supabase.from("event_grocery_lists").select("id").eq("id", parsed.data.listId).eq("user_id", user.id).maybeSingle();
  if (!list) return { success: false, message: "This grocery list is no longer available." };
  const purchaseState = await eventGroceryListIsPurchased(supabase, list.id);
  if (purchaseState.error) return { success: false, message: "We could not check this grocery list." };
  if (purchaseState.purchased) return { success: false, message: "Purchased grocery lists are read-only." };
  const { data: catalogItem } = await supabase.from("event_grocery_catalog_items").select("id").eq("id", parsed.data.catalogItemId).eq("is_active", true).maybeSingle();
  if (!catalogItem) return { success: false, message: "Choose an available grocery item." };
  const { data: existing } = await supabase.from("event_grocery_items").select("id, quantity").eq("list_id", list.id).eq("catalog_item_id", catalogItem.id).maybeSingle();
  const result = existing
    ? await supabase.from("event_grocery_items").update({ quantity: Number(existing.quantity) + parsed.data.quantity, unit: parsed.data.unit }).eq("id", existing.id)
    : await supabase.from("event_grocery_items").insert({ list_id: list.id, catalog_item_id: catalogItem.id, quantity: parsed.data.quantity, unit: parsed.data.unit });
  if (result.error) return { success: false, message: "We could not add this grocery item." };
  revalidatePath(`/dashboard/event-grocery/${list.id}`);
  revalidatePath("/dashboard/event-grocery");
  return { success: true, message: existing ? "Quantity combined with the existing item." : "Grocery item added." };
}

export async function updateEventGroceryItem(itemId: string, quantity: number, unit: z.infer<typeof itemSchema>["unit"]): Promise<EventGroceryActionResult> {
  const parsed = z.object({ itemId: z.string().uuid(), quantity: z.number().finite().positive("Quantity must be greater than zero.").max(999999), unit: z.enum(units) }).safeParse({ itemId, quantity, unit });
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Check the grocery item." };
  const { supabase, user } = await currentUser();
  if (!user) return { success: false, message: "Please sign in to manage grocery lists." };
  const { data: item } = await supabase.from("event_grocery_items").select("id, list_id, event_grocery_lists!inner(user_id)").eq("id", parsed.data.itemId).eq("event_grocery_lists.user_id", user.id).maybeSingle();
  if (!item) return { success: false, message: "This grocery item is no longer available." };
  const purchaseState = await eventGroceryListIsPurchased(supabase, item.list_id);
  if (purchaseState.error) return { success: false, message: "We could not check this grocery list." };
  if (purchaseState.purchased) return { success: false, message: "Purchased grocery lists are read-only." };
  const { error } = await supabase.from("event_grocery_items").update({ quantity: parsed.data.quantity, unit: parsed.data.unit }).eq("id", item.id);
  if (error) return { success: false, message: "We could not update this grocery item." };
  revalidatePath(`/dashboard/event-grocery/${item.list_id}`);
  revalidatePath("/dashboard/event-grocery");
  return { success: true, message: "Grocery item updated." };
}

export async function removeEventGroceryItem(itemId: string): Promise<EventGroceryActionResult> {
  if (!z.string().uuid().safeParse(itemId).success) return { success: false, message: "This grocery item is invalid." };
  const { supabase, user } = await currentUser();
  if (!user) return { success: false, message: "Please sign in to manage grocery lists." };
  const { data: item } = await supabase.from("event_grocery_items").select("id, list_id, event_grocery_lists!inner(user_id)").eq("id", itemId).eq("event_grocery_lists.user_id", user.id).maybeSingle();
  if (!item) return { success: false, message: "This grocery item is no longer available." };
  const purchaseState = await eventGroceryListIsPurchased(supabase, item.list_id);
  if (purchaseState.error) return { success: false, message: "We could not check this grocery list." };
  if (purchaseState.purchased) return { success: false, message: "Purchased grocery lists are read-only." };
  const { error } = await supabase.from("event_grocery_items").delete().eq("id", item.id);
  if (error) return { success: false, message: "We could not remove this grocery item." };
  revalidatePath(`/dashboard/event-grocery/${item.list_id}`);
  revalidatePath("/dashboard/event-grocery");
  return { success: true, message: "Grocery item removed." };
}
