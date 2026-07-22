import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { getEnv } from "@/lib/env";

export const metadata: Metadata = { title: "Access Not Available" };
export const dynamic = "force-dynamic";

export default function AccessDeniedPage({
  searchParams,
}: {
  searchParams: { portal?: string };
}) {
  const isAdmin = searchParams.portal === "admin";
  const studentDomain = getEnv().STUDENT_EMAIL_DOMAIN;

  return (
    <div className="mx-auto max-w-lg py-10 sm:py-16">
      <div className="overflow-hidden rounded-2xl border border-ep-border-soft bg-ep-card shadow-panel">
        <div className="flex items-center gap-3 bg-ep-coal px-6 py-5 text-white">
          <ShieldAlert aria-hidden className="h-7 w-7 text-ep-red" />
          <div>
            <p className="kicker text-white/70">Access check</p>
            <h1 className="text-3xl font-bold tracking-tight leading-tight text-white">
              We couldn&apos;t sign you in
            </h1>
          </div>
        </div>
        <div className="space-y-4 px-6 py-6 text-sm leading-relaxed text-ep-ink">
          {isAdmin ? (
            <>
              <p>
                That Google account isn&apos;t on the approved administrator
                list. Administrator access is limited to verified Eden Prairie
                Schools staff accounts and explicitly approved addresses.
              </p>
              <p className="text-ep-muted">
                If you believe you should have access, contact the EPHS AI
                administrator to be added to the approved list. Choosing the
                &ldquo;Administrator&rdquo; option never grants access on its
                own — every account is verified on the server.
              </p>
            </>
          ) : (
            <>
              <p>
                Students must sign in with their Eden Prairie Schools student
                Google account — an address ending in{" "}
                <span className="font-semibold text-ep-charcoal">
                  @{studentDomain}
                </span>
                .
              </p>
              <p className="text-ep-muted">
                Personal Gmail accounts and accounts from other domains
                can&apos;t access the student platform. If you have a district
                student account, please sign in again with that account.
              </p>
            </>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={isAdmin ? "/login/admin" : "/login/student"}
              className="rounded-lg bg-ep-red px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ep-red-dark"
            >
              Try a different account
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-ep-border bg-ep-card px-5 py-2.5 text-sm font-semibold text-ep-charcoal hover:bg-ep-bg"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
