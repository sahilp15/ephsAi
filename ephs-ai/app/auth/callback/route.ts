import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { provisionProfile, type GoogleIdentity } from "@/lib/auth/provision";
import { logAudit } from "@/lib/auth/audit";
import type { LoginIntent } from "@/lib/auth/rules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /auth/callback - the secure OAuth landing.
 *
 * Exchanges the Google authorization code for a session, then verifies the
 * account server-side: the email must be verified and must resolve to an
 * approved student or administrator role. Approval is derived from the
 * identity, never from which login button was pressed. On denial the session
 * is destroyed and the user is shown a professional access-denied page.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const intent: LoginIntent =
    url.searchParams.get("intent") === "admin" ? "admin" : "student";
  const next = url.searchParams.get("next");

  const loginPath = intent === "admin" ? "/login/admin" : "/login/student";
  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`${loginPath}?error=${reason}`, request.url));

  if (url.searchParams.get("error")) {
    // The provider itself returned an error (e.g. user cancelled).
    return fail("oauth");
  }
  if (!code) return fail("missing_code");

  const supabase = createSupabaseServerClient();
  if (!supabase) return fail("unconfigured");

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return fail("exchange");
  }

  const user = data.user;
  const meta = user.user_metadata ?? {};
  const emailVerified =
    Boolean(user.email_confirmed_at) || meta.email_verified === true;
  const identity: GoogleIdentity = {
    userId: user.id,
    email: user.email ?? (meta.email as string) ?? "",
    emailVerified,
    googleSub:
      (meta.provider_id as string) ??
      (meta.sub as string) ??
      user.identities?.[0]?.id ??
      null,
    fullName: (meta.full_name as string) ?? (meta.name as string) ?? "",
    avatarUrl: (meta.avatar_url as string) ?? (meta.picture as string) ?? null,
  };

  const result = await provisionProfile(identity);

  if (!result.ok) {
    // Destroy the just-created session so denied users hold no valid session.
    await supabase.auth.signOut();
    if (result.reason === "denied" || result.reason === "email_unverified") {
      await logAudit({
        actorId: user.id,
        actorEmail: identity.email.toLowerCase(),
        action: "auth.denied",
        detail: { intent, reason: result.reason },
      });
      return NextResponse.redirect(
        new URL(`/access-denied?portal=${intent}`, request.url),
      );
    }
    return fail(result.reason);
  }

  await logAudit({
    actorId: user.id,
    actorEmail: identity.email.toLowerCase(),
    action: result.isNew ? "auth.provision_profile" : "auth.login",
    detail: { role: result.role, isNew: result.isNew },
  });

  // Role-aware redirect. Admins go to the protected admin dashboard; first-time
  // students to onboarding; returning students back to where they were headed
  // (or the dashboard).
  let destination = "/dashboard";
  if (result.role === "admin") {
    destination = "/admin";
  } else if (!result.onboardingCompleted) {
    destination = "/onboarding";
  } else if (next && next.startsWith("/") && !next.startsWith("//")) {
    destination = next;
  }

  return NextResponse.redirect(new URL(destination, request.url));
}
