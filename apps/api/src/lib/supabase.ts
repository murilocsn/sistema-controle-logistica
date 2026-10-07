import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

let supabaseAdminClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (!env.supabaseConfigured) {
    throw new Error("Supabase server-side nao configurado.");
  }

  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });
  }

  return supabaseAdminClient;
}
