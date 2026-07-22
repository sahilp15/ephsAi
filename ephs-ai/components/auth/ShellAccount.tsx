"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogIn, LogOut } from "lucide-react";
import clsx from "clsx";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type AuthState =
  | { status: "loading" }
  | { status: "out" }
  | { status: "in"; name: string; email: string };

function useSession(): AuthState {
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
    const resolve = (
      user: { email?: string | null; user_metadata?: Record<string, unknown> } | null,
    ) => {
      if (!active) return;
      if (user) {
        const name =
          (user.user_metadata?.full_name as string) ||
          (user.user_metadata?.name as string) ||
          user.email ||
          "Account";
        setState({ status: "in", name, email: user.email ?? "" });
      } else {
        setState({ status: "out" });
      }
    };
    supabase.auth
      .getUser()
      .then(({ data }) => resolve(data.user))
      .catch(() => active && setState({ status: "out" }));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      resolve(session?.user ?? null),
    );
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);
  return state;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "EP";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "EP";
}

function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={clsx(
        "flex shrink-0 items-center justify-center rounded-full bg-ep-red text-white",
        className,
      )}
    >
      <span className="text-xs font-bold">{initials(name)}</span>
    </span>
  );
}

/** Sidebar footer account block. Collapses to an avatar-only sign-out. */
export function ShellAccount({ collapsed = false }: { collapsed?: boolean }) {
  const state = useSession();

  if (state.status === "loading") {
    return (
      <div className="flex items-center gap-3 rounded-lg px-2 py-2">
        <span className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-ep-bg-sunken" />
        {!collapsed ? (
          <span className="h-3 w-24 animate-pulse rounded bg-ep-bg-sunken" />
        ) : null}
      </div>
    );
  }

  if (state.status === "out") {
    return (
      <Link
        href="/login/student"
        className={clsx(
          "flex items-center gap-3 rounded-lg border border-ep-border bg-ep-card px-3 py-2 text-sm font-semibold text-ep-charcoal transition-colors hover:bg-ep-bg-sunken",
          collapsed && "justify-center px-0",
        )}
        title="Sign in"
      >
        <LogIn aria-hidden className="h-4 w-4 shrink-0 text-ep-red" />
        {!collapsed ? "Sign in" : null}
      </Link>
    );
  }

  const firstName = state.name.split(" ")[0] ?? state.name;

  if (collapsed) {
    return (
      <form action="/auth/signout" method="post" className="flex justify-center">
        <button
          type="submit"
          title={`${state.name} — sign out`}
          className="rounded-full transition-transform hover:scale-105"
          aria-label={`Sign out ${state.name}`}
        >
          <Avatar name={state.name} className="h-9 w-9" />
        </button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-ep-border-soft bg-ep-card p-2">
      <Link
        href="/profile"
        className="flex min-w-0 flex-1 items-center gap-2.5"
        title="Your profile"
      >
        <Avatar name={state.name} className="h-8 w-8" />
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-sm font-semibold text-ep-charcoal">
            {firstName}
          </span>
          <span className="block truncate text-[11px] text-ep-faint">
            {state.email || "Student"}
          </span>
        </span>
      </Link>
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="rounded-md p-1.5 text-ep-faint transition-colors hover:bg-ep-bg-sunken hover:text-ep-charcoal"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut aria-hidden className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
