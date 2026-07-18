import "server-only";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getEnv } from "@/lib/env";
import type { Database } from "./types";

/**
 * Request-scoped Supabase client for Server Components, Route Handlers and
 * Server Actions. The user session is read from — and refreshed into — secure,
 * HTTP-only, same-site cookies. This client always runs with the anon key and
 * the caller's session, so Row Level Security applies: it can never read or
 * write another user's rows.
 *
 * Returns null when Supabase is not configured so callers can degrade
 * gracefully (the app still serves the public catalog with no accounts).
 */
export function createSupabaseServerClient() {
  const env = getEnv();
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  const cookieStore = cookies();
  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[],
        ) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // `set` throws when called from a Server Component render (cookies
            // are read-only there). Session refresh still happens in middleware,
            // so this is safe to ignore.
          }
        },
      },
    },
  );
}
