/**
 * Pure, dependency-free authorization rules.
 *
 * This module is the single source of truth for *who may sign in and with
 * what role*. It has no I/O and no environment access so it can be unit
 * tested exhaustively and imported from any runtime. The concrete
 * configuration (which domains / which allowlisted emails) is resolved from
 * secure server-side environment variables in `lib/auth/config.ts` and passed
 * in as `RoleRules` — never hard-coded here, never shipped to the client.
 */

export type AppRole = "student" | "admin";

/** Which portal the user chose. Used only for redirect + messaging, never to grant privilege. */
export type LoginIntent = "student" | "admin";

export interface RoleRules {
  /** Exact domain an approved student email must end with, e.g. "ep-student.org". */
  studentDomain: string;
  /** Exact domain that confers administrator access, e.g. "edenpr.k12.mn.us". */
  adminDomain: string;
  /** Explicitly approved administrator emails (already normalized to lowercase). */
  adminEmails: string[];
}

/**
 * Normalize an email for comparison: trim surrounding whitespace and lowercase.
 * Google may return addresses with varied casing; we always compare normalized.
 */
export function normalizeEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

/** The domain portion of an email (already-normalized-safe), or null when malformed. */
export function emailDomain(email: string | null | undefined): string | null {
  const normalized = normalizeEmail(email);
  const at = normalized.lastIndexOf("@");
  if (at <= 0 || at === normalized.length - 1) return null;
  const domain = normalized.slice(at + 1);
  // Reject addresses with more than one "@" or empty local part.
  if (normalized.slice(0, at).includes("@")) return null;
  return domain;
}

/** Parse a comma/space/semicolon-separated allowlist string into normalized emails. */
export function parseAdminAllowlist(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return Array.from(
    new Set(
      raw
        .split(/[,;\s]+/)
        .map((e) => normalizeEmail(e))
        .filter((e) => e.length > 0 && e.includes("@")),
    ),
  );
}

/** True only when the verified email ends exactly with the approved student domain. */
export function isStudentEmail(
  email: string | null | undefined,
  rules: RoleRules,
): boolean {
  const domain = emailDomain(email);
  return domain !== null && domain === rules.studentDomain.toLowerCase();
}

/**
 * True when the verified email confers administrator access: it either ends
 * exactly with the approved administrator domain, or exactly matches one of the
 * explicitly allowlisted administrator emails.
 */
export function isAdminEmail(
  email: string | null | undefined,
  rules: RoleRules,
): boolean {
  const normalized = normalizeEmail(email);
  if (rules.adminEmails.includes(normalized)) return true;
  const domain = emailDomain(email);
  return domain !== null && domain === rules.adminDomain.toLowerCase();
}

/**
 * Derive the effective application role from a *verified* Google email.
 *
 * The role is a property of the identity, not of which button the user
 * pressed. Administrators are checked first so an allowlisted address is never
 * demoted. Returns null when the account is approved for neither role — the
 * caller must then deny access.
 */
export function deriveRole(
  email: string | null | undefined,
  rules: RoleRules,
): AppRole | null {
  if (isAdminEmail(email, rules)) return "admin";
  if (isStudentEmail(email, rules)) return "student";
  return null;
}

export type AccessDecision =
  | { allowed: true; role: AppRole }
  | { allowed: false; role: null; reason: AccessDenialReason };

export type AccessDenialReason =
  | "not_student_domain"
  | "not_admin"
  | "unrecognized";

/**
 * Decide whether a verified email may enter the requested portal.
 *
 * Security invariant: the granted role always comes from `deriveRole`, so
 * selecting "Admin Login" can never by itself confer admin. When an email is
 * valid for the *other* portal than requested, we still sign the user in with
 * their true derived role (friendly + safe); when it is valid for neither, we
 * deny with a portal-appropriate reason for a clear user-facing message.
 */
export function decideAccess(
  email: string | null | undefined,
  intent: LoginIntent,
  rules: RoleRules,
): AccessDecision {
  const role = deriveRole(email, rules);
  if (role) return { allowed: true, role };
  return {
    allowed: false,
    role: null,
    reason: intent === "admin" ? "not_admin" : "not_student_domain",
  };
}
