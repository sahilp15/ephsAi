"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, UserPlus } from "lucide-react";
import { addAdminAction, removeAdminAction } from "@/app/(staff)/admin/actions";
import type { AdminAllowlistRow } from "@/lib/supabase/types";

export function AdminAccessManager({
  initial,
  envDomain,
  envAllowlist,
}: {
  initial: AdminAllowlistRow[];
  envDomain: string;
  envAllowlist: string[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setSaving(true);
    setError(null);
    const res = await addAdminAction(email, note || undefined);
    setSaving(false);
    if (!res.ok) {
      setError(res.error === "invalid_email" ? "Enter a valid email address." : "Couldn't add that admin.");
      return;
    }
    setEmail("");
    setNote("");
    router.refresh();
  }

  async function remove(e: string) {
    await removeAdminAction(e);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-ep-border-soft bg-ep-card p-4 shadow-card">
        <h3 className="text-sm font-bold text-ep-charcoal">Approved from configuration</h3>
        <p className="mt-1 text-sm text-ep-ink">
          Any verified <span className="font-semibold">@{envDomain}</span> Google
          account is an administrator.
        </p>
        {envAllowlist.length > 0 ? (
          <p className="mt-1 text-sm text-ep-muted">
            Plus environment allowlist: {envAllowlist.join(", ")}
          </p>
        ) : null}
        <p className="mt-1 text-xs text-ep-faint">
          These are set in secure server configuration and can&apos;t be changed here.
        </p>
      </div>

      <div className="rounded-xl border border-ep-border-soft bg-ep-card p-4 shadow-card">
        <h3 className="text-sm font-bold text-ep-charcoal">Grant admin access to another account</h3>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="flex-1 min-w-[14rem] rounded-md border border-ep-border bg-ep-card px-2 py-1.5 text-sm outline-none focus:border-ep-red"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className="rounded-md border border-ep-border bg-ep-card px-2 py-1.5 text-sm outline-none focus:border-ep-red"
          />
          <button
            type="button"
            onClick={add}
            disabled={saving || !email.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ep-red px-4 py-2 text-sm font-semibold text-white hover:bg-ep-red-dark disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Grant access
          </button>
        </div>
        {error ? <p className="mt-2 text-sm text-ep-red-dark">{error}</p> : null}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-ep-faint">
          Additional approved admins ({initial.length})
        </h3>
        {initial.length === 0 ? (
          <p className="text-sm text-ep-muted">None added yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {initial.map((a) => (
              <li
                key={a.email}
                className="flex items-center justify-between rounded-lg border border-ep-border-soft bg-ep-card px-3 py-2 text-sm"
              >
                <span className="text-ep-ink">
                  <span className="font-semibold">{a.email}</span>
                  {a.note ? <span className="text-ep-muted"> — {a.note}</span> : null}
                </span>
                <button
                  type="button"
                  onClick={() => remove(a.email)}
                  className="text-ep-faint hover:text-ep-red-dark"
                  aria-label="Remove admin"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
