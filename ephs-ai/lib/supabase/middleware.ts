import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Database } from "./types";

/**
 * Route prefixes that require an authenticated session. Fine-grained role
 * checks (student vs admin) are enforced in the page / route handler itself via
 * `requireStudent` / `requireAdmin`; middleware only guarantees that an
 * unauthenticated visitor is redirected to the correct login before any
 * protected server code runs.
 */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/onboarding",
  "/plan",
  "/profile",
  "/transcript",
  "/admin",
  "/api/onboarding",
  "/api/transcript",
  "/api/academic",
  "/api/plan",
  "/api/admin",
];

/** Admin-area prefixes: unauthenticated visitors are sent to the admin login. */
const ADMIN_PREFIXES = ["/admin", "/api/admin"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function isAdminArea(pathname: string): boolean {
  return ADMIN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Refresh the Supabase session on every request (rotating cookies as needed)
 * and redirect unauthenticated visitors away from protected routes. This runs
 * before any server component, so it is a real backend gate, not a client
 * route guard. When Supabase is unconfigured the app runs in public catalog
 * mode and this is a no-op.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response;

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[],
      ) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // IMPORTANT: getUser() revalidates the token against the auth server; do not
  // trust getSession() alone for authorization decisions.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  if (!user && isProtected(pathname)) {
    const loginPath = isAdminArea(pathname) ? "/login/admin" : "/login/student";
    // API routes get a clean 401 instead of an HTML redirect.
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "unauthenticated", message: "Sign in to continue." },
        { status: 401 },
      );
    }
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = loginPath;
    redirectUrl.search = "";
    redirectUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
