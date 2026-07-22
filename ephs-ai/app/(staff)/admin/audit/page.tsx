import type { Metadata } from "next";
import { adminListAudit } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Admin · Audit Log" };
export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  const events = await adminListAudit(150);
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-ep-charcoal">Audit log</h2>
        <p className="mt-0.5 text-sm text-ep-muted">
          Recent privileged and sensitive actions. Newest first.
        </p>
      </div>
      {events.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ep-border bg-ep-card p-6 text-center text-sm text-ep-muted">
          No audit events recorded yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ep-border-soft bg-ep-card shadow-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ep-border-soft text-xs uppercase tracking-wide text-ep-faint">
                <th className="px-4 py-2.5">When</th>
                <th className="px-4 py-2.5">Actor</th>
                <th className="px-4 py-2.5">Action</th>
                <th className="px-4 py-2.5">Target</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-b border-ep-border-soft last:border-0">
                  <td className="whitespace-nowrap px-4 py-2 text-xs text-ep-muted">
                    {new Date(e.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-xs text-ep-ink">{e.actor_email ?? e.actor_id ?? "system"}</td>
                  <td className="px-4 py-2">
                    <span className="rounded-[2px] bg-ep-bg px-1.5 py-0.5 font-mono text-[11px] text-ep-ink">
                      {e.action}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-mono text-[11px] text-ep-muted">{e.target ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
