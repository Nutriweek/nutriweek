"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import type { ShoppingProvider, ShoppingProviderActionResult, ShoppingProviderId } from "./types";

export async function getShoppingProviders(): Promise<ShoppingProvider[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("shopping_providers").select("id, name, provider_type, status, sort_order, icon").order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []) as ShoppingProvider[];
}

export async function updatePreferredShoppingProvider(providerId: ShoppingProviderId): Promise<ShoppingProviderActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Please sign in to update your shopping provider." };

  const { data: membership, error: membershipError } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (membershipError || !membership) return { success: false, message: "Your household is not available." };

  const { data, error } = await supabase.rpc("set_household_shopping_provider", {
    target_household_id: membership.household_id,
    target_provider_id: providerId,
  }).single();
  if (error || !data) return { success: false, message: "We could not update your shopping provider." };
  const result = data as ShoppingProviderActionResult;
  if (!result.success) return result;

  revalidatePath("/dashboard/grocery");
  return result;
}
