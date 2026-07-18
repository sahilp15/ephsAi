import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppRole, ProfileRow, StudentOnboardingRow } from "@/lib/supabase/types";

/**
 * Server-side authentication + authorization helpers.
 *
 * Every protected page, route handler, and server action calls one of these.
 * The role is read from the database `profiles` row (provisioned from the
 * verified Google identity in the auth callback) — never from a client-
 * submitted value, cookie flag, or the login button the user pressed. This is
 * the backend authorization layer; the middleware redirect and any client
 * route guard are conveniences on top of it, not the security boundary.
 */

export interface SessionUser {
  id: string;
  email: string;
  role: AppRole;
  displayName: string;
  onboardingCompleted: boolean;
  studentType: "new" | "returning" | null;
  avatarUrl: string | null;
  profile: ProfileRow | null;
}

/** Resolve the current authenticated user + profile, or null when signed out. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  const profile = (data as ProfileRow | null) ?? null;

  const email = (user.email ?? profile?.email ?? "").toLowerCase();
  return {
    id: user.id,
    email,
    role: (profile?.role as AppRole | undefined) ?? "student",
    displayName: profile?.display_name || (user.user_metadata?.full_name as string) || "",
    onboardingCompleted: profile?.onboarding_completed ?? false,
    studentType: profile?.student_type ?? null,
    avatarUrl: profile?.avatar_url ?? null,
    profile,
  };
}

/** Require any authenticated user; redirect to the student login otherwise. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login/student");
  return user;
}

/**
 * Require an authenticated student. Admins are sent to their own dashboard;
 * unauthenticated visitors to the student login.
 */
export async function requireStudent(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login/student");
  if (user.role === "admin") redirect("/admin");
  return user;
}

/**
 * Require an approved administrator. This is the single backend gate for the
 * entire admin area; it never trusts anything but the DB role.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login/admin");
  if (user.role !== "admin") redirect("/access-denied?portal=admin");
  return user;
}

/** Fetch the student's extended onboarding responses (server-side, owner-scoped). */
export async function getOnboarding(
  studentId: string,
): Promise<StudentOnboardingRow | null> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("student_onboarding")
    .select("*")
    .eq("student_id", studentId)
    .maybeSingle();
  return (data as StudentOnboardingRow | null) ?? null;
}
