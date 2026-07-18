import "server-only";
import { getEnv } from "@/lib/env";
import { parseAdminAllowlist, type RoleRules } from "./rules";

/**
 * Server-only resolver for the authorization configuration.
 *
 * The approved student/admin domains and the administrator allowlist live in
 * environment variables (see `.env.example`) and are read here — one place —
 * so they are never scattered through the codebase and never bundled into
 * client code. Adding another approved administrator is a config change
 * (extend ADMIN_EMAIL_ALLOWLIST), not a code change.
 */
export function getRoleRules(): RoleRules {
  const env = getEnv();
  return {
    studentDomain: env.STUDENT_EMAIL_DOMAIN.trim().toLowerCase(),
    adminDomain: env.ADMIN_EMAIL_DOMAIN.trim().toLowerCase(),
    adminEmails: parseAdminAllowlist(env.ADMIN_EMAIL_ALLOWLIST),
  };
}

/** True when Supabase Auth is configured (URL + anon key present). */
export function supabaseConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/** True when the trusted service-role key is available for server-side admin writes. */
export function serviceRoleConfigured(): boolean {
  return Boolean(getEnv().SUPABASE_SERVICE_ROLE_KEY);
}
