import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Global middleware: refreshes the Supabase session cookie and gates protected
 * routes for unauthenticated visitors before any server code runs.
 */
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on all routes except Next.js internals and static assets. The
     * per-request work is cheap (a cookie read + token check) and skips when
     * Supabase is unconfigured.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
