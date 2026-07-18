import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRoleRules } from "./config";
import { deriveRole, normalizeEmail, type AppRole } from "./rules";

/**
 * Verified Google identity fields, taken from the Supabase session's user
 * object after the OAuth code exchange (server-side, trusted).
 */
export interface GoogleIdentity {
  userId: string; // Supabase auth uid
  email: string; // verified email from the provider
  emailVerified: boolean;
  googleSub: string | null; // stable Google account id
  fullName: string;
  avatarUrl: string | null;
}

export type ProvisionResult =
  | {
      ok: true;
      role: AppRole;
      onboardingCompleted: boolean;
      isNew: boolean;
    }
  | { ok: false; reason: "denied" | "unconfigured" | "email_unverified" | "error" };

/**
 * Resolve the effective role for a verified email: the env-configured domain /
 * allowlist rules first, then the DB-managed administrator allowlist (which
 * lets admins approve more administrators later without a deploy).
 */
export async function resolveRole(email: string): Promise<AppRole | null> {
  const normalized = normalizeEmail(email);
  const fromRules = deriveRole(normalized, getRoleRules());
  if (fromRules) return fromRules;

  const admin = createSupabaseAdminClient();
  if (admin) {
    const { data } = await admin
      .from("admin_allowlist")
      .select("email")
      .eq("email", normalized)
      .maybeSingle();
    if (data) return "admin";
  }
  return null;
}

/**
 * Idempotently provision (or refresh) the profile for a verified Google
 * identity and return the authoritative role. Safe to run on every login:
 *   - denies accounts approved for neither role,
 *   - never creates duplicate profiles for the same user / email,
 *   - preserves onboarding progress and any existing display name,
 *   - always re-syncs the role from the current rules + allowlist.
 */
export async function provisionProfile(
  identity: GoogleIdentity,
): Promise<ProvisionResult> {
  const admin = createSupabaseAdminClient();
  if (!admin) return { ok: false, reason: "unconfigured" };

  if (!identity.emailVerified) return { ok: false, reason: "email_unverified" };

  const email = normalizeEmail(identity.email);
  const role = await resolveRole(email);
  if (!role) return { ok: false, reason: "denied" };

  const now = new Date().toISOString();

  const { data: existing, error: readErr } = await admin
    .from("profiles")
    .select("user_id, display_name, onboarding_completed, role")
    .eq("user_id", identity.userId)
    .maybeSingle();
  if (readErr) {
    console.error("[provision] read error:", readErr.message);
    return { ok: false, reason: "error" };
  }

  if (existing) {
    const { error } = await admin
      .from("profiles")
      .update({
        role,
        email,
        google_sub: identity.googleSub,
        avatar_url: identity.avatarUrl,
        display_name: existing.display_name || identity.fullName,
        last_login_at: now,
        updated_at: now,
      })
      .eq("user_id", identity.userId);
    if (error) {
      console.error("[provision] update error:", error.message);
      return { ok: false, reason: "error" };
    }
    return {
      ok: true,
      role,
      onboardingCompleted: existing.onboarding_completed ?? false,
      isNew: false,
    };
  }

  const { error } = await admin.from("profiles").insert({
    user_id: identity.userId,
    role,
    email,
    google_sub: identity.googleSub,
    avatar_url: identity.avatarUrl,
    display_name: identity.fullName,
    onboarding_completed: false,
    last_login_at: now,
    created_at: now,
    updated_at: now,
  });
  if (error) {
    // A concurrent first login may have inserted the row already; treat a
    // unique-violation as success (idempotent) and re-read.
    console.error("[provision] insert error:", error.message);
    const { data: raced } = await admin
      .from("profiles")
      .select("onboarding_completed")
      .eq("user_id", identity.userId)
      .maybeSingle();
    if (raced) {
      return {
        ok: true,
        role,
        onboardingCompleted: raced.onboarding_completed ?? false,
        isNew: false,
      };
    }
    return { ok: false, reason: "error" };
  }

  return { ok: true, role, onboardingCompleted: false, isNew: true };
}
