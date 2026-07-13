import type { Tables, TablesUpdate } from "@/lib/supabase/database.types";

export type Profile = Tables<"profiles">;
export type ProfileUpdate = TablesUpdate<"profiles">;

export type ProfileActionResult =
  | { success: true; message: string }
  | { success: false; message: string };
