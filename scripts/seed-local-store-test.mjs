import { createClient } from "@supabase/supabase-js";

const testUserId = process.env.LOCAL_STORE_TEST_USER_ID;
if (process.env.NODE_ENV === "production") throw new Error("The local-store test seed cannot run in production.");
if (process.env.LOCAL_STORE_TEST_SEED !== "true") throw new Error("Set LOCAL_STORE_TEST_SEED=true to explicitly run the local-store test seed.");
if (!testUserId) throw new Error("Set LOCAL_STORE_TEST_USER_ID to the authenticated test user's UUID.");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) throw new Error("Supabase URL and service-role credentials are required.");

const supabase = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
const testStoreName = "Nutriweek Test Local Store";
const testStoreEmail = "local-store-test@nutriweek.invalid";

const { data: address, error: addressError } = await supabase
  .from("customer_addresses")
  .select("location")
  .eq("user_id", testUserId)
  .eq("is_active", true)
  .order("is_default", { ascending: false })
  .limit(1)
  .maybeSingle();
if (addressError || !address?.location) throw new Error("The test user needs an active delivery address before a test store can be seeded.");

const { data: existingStore, error: existingStoreError } = await supabase
  .from("stores")
  .select("id")
  .eq("name", testStoreName)
  .eq("contact_email", testStoreEmail)
  .limit(1)
  .maybeSingle();
if (existingStoreError) throw new Error("Unable to look up the local-store test seed.");

const storeValues = {
  name: testStoreName,
  contact_name: "Nutriweek Development",
  contact_phone: "+910000000000",
  contact_email: testStoreEmail,
  line1: "Development test location",
  line2: null,
  landmark: null,
  city: "Test City",
  state_province: "Test State",
  postal_code: "000000",
  country_code: "IN",
  location: address.location,
  network_status: "active",
  operating_status: "open",
};

const storeRequest = existingStore
  ? supabase.from("stores").update(storeValues).eq("id", existingStore.id).select("id").single()
  : supabase.from("stores").insert(storeValues).select("id").single();
const { data: store, error: storeError } = await storeRequest;
if (storeError || !store) throw new Error("Unable to create the local-store test seed.");

const { error: membershipError } = await supabase
  .from("store_members")
  .upsert({ store_id: store.id, user_id: testUserId, role: "owner", is_active: true }, { onConflict: "store_id,user_id" });
if (membershipError) throw new Error("Unable to grant the test user store membership.");

console.log(`Ready: ${testStoreName} is active at the test user's delivery location, with that user as an active owner (${store.id}).`);
