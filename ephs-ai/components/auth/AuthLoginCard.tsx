"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ShieldCheck, GraduationCap, Lock } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { LoginIntent } from "@/lib/auth/rules";

const ERROR_COPY: Record<string, string> = {
  oauth: "Google sign-in was cancelled. Please try again when you're ready.",
  missing_code: "Sign-in didn't complete. Please start again.",
  exchange:
    "We couldn't verify your Google sign-in. Please try again, and make sure you're using the correct account.",
  unconfigured:
    "Sign-in is not configured on this environment yet. Please contact your administrator.",
  error: "Something went wrong while signing you in. Please try again.",
};

function GoogleGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

export function AuthLoginCard({
  intent,
  configured,
  studentDomain,
  next,
  initialError,
}: {
  intent: LoginIntent;
  configured: boolean;
  studentDomain: string;
  next?: string;
  initialError?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(() =>
    initialError
      ? ERROR_COPY[initialError] ??
        "Something went wrong while signing you in. Please try again."
      : null,
  );

  const isAdmin = intent === "admin";

  async function signIn() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = new URL("/auth/callback", window.location.origin);
      redirectTo.searchParams.set("intent", intent);
      if (next) redirectTo.searchParams.set("next", next);

      const queryParams: Record<string, string> = { prompt: "select_account" };
      // Hint the student hosted domain in Google's picker (server still enforces).
      if (!isAdmin && studentDomain) queryParams.hd = studentDomain;

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectTo.toString(), queryParams },
      });
      if (oauthError) {
        setError(
          "We couldn't start Google sign-in. Please try again in a moment.",
        );
        setLoading(false);
      }
      // On success the browser redirects to Google; keep the spinner.
    } catch {
      setError("Sign-in is unavailable right now. Please try again later.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="overflow-hidden rounded-2xl border border-ep-border-soft bg-ep-card shadow-pop">
        <div
          className={`relative px-6 py-7 ${isAdmin ? "bg-ep-coal" : "bg-ep-red"} text-white`}
        >
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15"
            >
              {isAdmin ? (
                <ShieldCheck className="h-6 w-6" />
              ) : (
                <GraduationCap className="h-6 w-6" />
              )}
            </span>
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                {isAdmin ? "Staff & Counselors" : "Eden Prairie Students"}
              </p>
              <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-white">
                {isAdmin ? "Administrator sign in" : "Student sign in"}
              </h1>
            </div>
          </div>
        </div>

        <div className="space-y-5 px-6 py-6">
          <p className="text-sm leading-relaxed text-ep-ink">
            {isAdmin
              ? "Approved Eden Prairie Schools staff and counselors sign in with a verified district Google account to manage students, review transcripts, and maintain the course catalog."
              : "Sign in with your Eden Prairie Schools student Google account to build your four-year plan, import your transcript, and track your graduation progress."}
          </p>

          {error ? (
            <div
              role="alert"
              className="rounded-r-lg border-l-4 border-ep-red bg-ep-red-soft p-3.5 text-sm text-ep-red-dark"
            >
              {error}
            </div>
          ) : null}

          {configured ? (
            <button
              type="button"
              onClick={signIn}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-ep-border bg-ep-card px-4 py-3 text-sm font-semibold text-ep-charcoal shadow-xs transition-all hover:bg-ep-bg-sunken disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <Loader2 aria-hidden className="h-5 w-5 animate-spin text-ep-red" />
              ) : (
                <GoogleGlyph />
              )}
              {loading ? "Redirecting to Google…" : "Continue with Google"}
            </button>
          ) : (
            <div className="rounded-r-lg border-l-4 border-ep-warn bg-ep-warn-soft p-3.5 text-sm text-ep-warn">
              Google sign-in isn&apos;t configured on this environment yet. An
              administrator needs to set the Supabase and Google OAuth
              credentials (see the project&apos;s <code>.env.example</code>).
            </div>
          )}

          <div className="flex items-start gap-2 rounded-lg bg-ep-bg px-3 py-2.5 text-xs text-ep-muted">
            <Lock aria-hidden className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-ep-faint" />
            <p>
              {isAdmin
                ? "Access is restricted to approved district accounts and verified server-side. Selecting this option does not by itself grant administrator access."
                : `Only verified @${studentDomain} student accounts are allowed. Personal Gmail and other domains are declined.`}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between text-sm">
        <Link href="/" className="font-semibold text-ep-muted hover:text-ep-charcoal">
          ← Back to home
        </Link>
        <Link
          href={isAdmin ? "/login/student" : "/login/admin"}
          className="font-semibold text-ep-red hover:text-ep-red-dark"
        >
          {isAdmin ? "Student sign in" : "Administrator sign in"} →
        </Link>
      </div>
    </div>
  );
}
