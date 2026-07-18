import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getEnv } from "@/lib/env";
import type { Database } from "./types";

/**
 * Trusted service-role Supabase client. This client BYPASSES Row Level
 * Security, so it must only ever be used from server-side code after the
 * caller's identity and role have been verified, and never exposed to the
 * browser. It is used for:
 *   - idempotent profile provisioning in the auth callback,
 *   - writing audit events,
 *   - reading private transcript files and signing short-lived URLs,
 *   - administrator operations already gated by `requireAdmin`.
 *
 * Returns null when the service-role key is not configured.
 */
export function createSupabaseAdminClient() {
  const env = getEnv();
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
