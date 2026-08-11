"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export type CustomerAddress = {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  summary: string;
  isDefault: boolean;
};

const addressSchema = z.object({
  label: z.string().trim().min(1).max(80),
  recipientName: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(6).max(30),
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional(),
  landmark: z.string().trim().max(160).optional(),
  city: z.string().trim().min(1).max(120),
  stateProvince: z.string().trim().min(1).max(120),
  postalCode: z.string().trim().min(1).max(20),
  latitude: z.number().finite().gte(-90).lte(90),
  longitude: z.number().finite().gte(-180).lte(180),
});

type AddressRow = {
  id: string;
  label: string;
  recipient_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state_province: string;
  postal_code: string;
  is_default: boolean;
};

function formatAddress(address: AddressRow) {
  return [address.line1, address.line2, address.city, address.state_province, address.postal_code].filter(Boolean).join(", ");
}

async function getAddressContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in to manage delivery addresses.");
  const { data: membership, error } = await supabase.from("household_members").select("household_id").eq("user_id", user.id).order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (error || !membership) throw new Error("Your household is not available.");
  return { supabase, userId: user.id, householdId: membership.household_id };
}

type QueryResult = { data: unknown; error: { message?: string } | null };
type AddressQuery = PromiseLike<QueryResult> & {
  select: (columns: string, options?: { count?: "exact"; head?: boolean }) => AddressQuery;
  insert: (values: Record<string, unknown>) => AddressQuery;
  eq: (column: string, value: unknown) => AddressQuery;
  order: (column: string, options?: { ascending?: boolean }) => AddressQuery;
  limit: (count: number) => AddressQuery;
  maybeSingle: () => Promise<{ data: unknown; error: { message?: string } | null }>;
  single: () => Promise<{ data: unknown; error: { message?: string } | null }>;
}

function addresses(supabase: unknown): AddressQuery {
  return (supabase as { from: (table: string) => AddressQuery }).from("customer_addresses");
}

export async function getCustomerAddresses(): Promise<CustomerAddress[]> {
  const { supabase, userId } = await getAddressContext();
  const { data, error } = await addresses(supabase).select("id, label, recipient_name, phone, line1, line2, city, state_province, postal_code, is_default").eq("user_id", userId).eq("is_active", true).order("is_default", { ascending: false }).order("created_at", { ascending: false });
  if (error) throw new Error("Unable to load delivery addresses.");
  return ((data ?? []) as AddressRow[]).map((address) => ({ id: address.id, label: address.label, recipientName: address.recipient_name, phone: address.phone, summary: formatAddress(address), isDefault: address.is_default }));
}

export async function createCustomerAddress(input: z.infer<typeof addressSchema>): Promise<{ success: true; address: CustomerAddress } | { success: false; message: string }> {
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Complete all required address fields and provide a valid delivery location." };
  try {
    const { supabase, userId, householdId } = await getAddressContext();
    const { data: existingAddress, error: existingAddressError } = await addresses(supabase).select("id").eq("user_id", userId).eq("is_active", true).limit(1).maybeSingle();
    if (existingAddressError) throw new Error("Unable to prepare your delivery address.");
    const address = parsed.data;
    const { data, error } = await addresses(supabase).insert({
      user_id: userId,
      household_id: householdId,
      label: address.label,
      recipient_name: address.recipientName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 || null,
      landmark: address.landmark || null,
      city: address.city,
      state_province: address.stateProvince,
      postal_code: address.postalCode,
      country_code: "IN",
      location: `SRID=4326;POINT(${address.longitude} ${address.latitude})`,
      is_active: true,
      is_default: !existingAddress,
    }).select("id, label, recipient_name, phone, line1, line2, city, state_province, postal_code, is_default").single();
    if (error || !data) throw new Error("Unable to save your delivery address.");
    const saved = data as AddressRow;
    return { success: true, address: { id: saved.id, label: saved.label, recipientName: saved.recipient_name, phone: saved.phone, summary: formatAddress(saved), isDefault: saved.is_default } };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Unable to save your delivery address." };
  }
}
