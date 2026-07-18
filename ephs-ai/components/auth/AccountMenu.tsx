"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, User } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type AuthState =
  | { status: "loading" }
  | { status: "out" }
  | { status: "in"; name: string };

/**
 * Compact account control for the header. Reflects the real session (read via
 * the browser Supabase client) and offers a secure server-side sign-out. When
 * Supabase is unconfigured it simply offers a sign-in link.
 */
export function AccountMenu({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    let supabase: ReturnType<typeof createSupabaseBrowserClient>;
    try {
      supabase = createSupabaseBrowserClient();
    } catch {
      setState({ status: "out" });
      return;
    }
    const resolve = (user: { email?: string | null; user_metadata?: Record<string, unknown> } | null) => {
      if (!active) return;
      if (user) {
        const name =
          (user.user_metadata?.full_name as string) ||
          (user.user_metadata?.name as string) ||
          user.email ||
          "Account";
        setState({ status: "in", name });
      } else {
        setState({ status: "out" });
      }
    };
    supabase.auth
      .getUser()
      .then(({ data }) => resolve(data.user))
      .catch(() => active && setState({ status: "out" }));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      resolve(session?.user ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (state.status === "loading") {
    return <div aria-hidden className="h-9 w-20 animate-pulse rounded-md bg-white/10" />;
  }

  if (state.status === "out") {
    return (
      <Link
        href="/login/student"
        className={
          variant === "desktop"
            ? "rounded-md px-3 py-2 font-display text-[15px] font-semibold uppercase tracking-wider text-white/60 transition-colors hover:text-white"
            : "block rounded-md px-3 py-2.5 font-display text-base font-semibold uppercase tracking-wider text-white/70 hover:bg-white/5 hover:text-white"
        }
      >
        Sign in
      </Link>
    );
  }

  const firstName = state.name.split(" ")[0] ?? state.name;

  if (variant === "mobile") {
    return (
      <form action="/auth/signout" method="post" className="mt-1 border-t border-white/10 pt-2">
        <p className="flex items-center gap-2 px-3 py-1.5 text-sm text-white/60">
          <User aria-hidden className="h-4 w-4" /> {state.name}
        </p>
        <button
          type="submit"
          className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left font-display text-base font-semibold uppercase tracking-wider text-white/70 hover:bg-white/5 hover:text-white"
        >
          <LogOut aria-hidden className="h-4 w-4" /> Sign out
        </button>
      </form>
    );
  }

  return (
    <form action="/auth/signout" method="post" className="flex items-center gap-2">
      <Link
        href="/profile"
        className="hidden items-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium text-white/70 transition-colors hover:text-white xl:flex"
        title="Your profile"
      >
        <User aria-hidden className="h-4 w-4" />
        <span className="max-w-[9rem] truncate">{firstName}</span>
      </Link>
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-2 text-sm font-semibold text-white/70 transition-colors hover:border-white/30 hover:text-white"
      >
        <LogOut aria-hidden className="h-4 w-4" />
        <span className="hidden sm:inline">Sign out</span>
      </button>
    </form>
  );
}
