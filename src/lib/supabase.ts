import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./env";

let cachedSupabaseClient: SupabaseClient | null | undefined;

export function getSupabaseClient() {
  if (cachedSupabaseClient !== undefined) {
    return cachedSupabaseClient;
  }

  const config = getSupabaseConfig();

  cachedSupabaseClient = config
    ? createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      })
    : null;

  return cachedSupabaseClient;
}
