import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { adminListStudents, adminStats } from "@/lib/data/admin";
import { StatCard } from "@/components/ui";

export const metadata: Metadata = { title: "Admin · Overview" };
export const dynamic = "force-dynamic";

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q ?? "";
  const [stats, students] = await Promise.all([adminStats(), adminListStudents(q)]);

  return (
    <div className="space-y-6">
      <section aria-label="Statistics" className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Students" value={stats.students} />
        <StatCard label="Onboarded" value={stats.onboarded} />
        <StatCard label="Transcripts confirmed" value={stats.transcriptsProcessed} />
        <StatCard label="Processing errors" value={stats.transcriptsFailed} />
        <StatCard label="Low-confidence rows" value={stats.lowConfidenceRows} hint="Awaiting review" />
      </section>

      <section aria-label="Students" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ep-charcoal">Registered students</h2>
        </div>
        <form action="/admin" method="get" className="relative max-w-md">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-ep-faint" aria-hidden />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name or email…"
            className="w-full rounded-md border border-ep-border bg-white py-2 pl-8 pr-3 text-sm outline-none focus:border-ep-red"
          />
        </form>

        {students.length === 0 ? (
          <p className="rounded-xl border border-dashed border-ep-border bg-white p-6 text-center text-sm text-ep-muted">
            {q ? "No students match that search." : "No students have registered yet."}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-ep-border-soft bg-white shadow-card">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ep-border-soft text-xs uppercase tracking-wide text-ep-faint">
                  <th className="px-4 py-2.5">Student</th>
                  <th className="px-4 py-2.5">Grade</th>
                  <th className="px-4 py-2.5">Onboarding</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Last login</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.userId} className="border-b border-ep-border-soft last:border-0 hover:bg-ep-bg/50">
                    <td className="px-4 py-2.5">
                      <Link href={`/admin/students/${s.userId}`} className="font-semibold text-ep-charcoal hover:text-ep-red-dark">
                        {s.displayName || "—"}
                      </Link>
                      <p className="text-xs text-ep-faint">{s.email}</p>
                    </td>
                    <td className="px-4 py-2.5 text-ep-muted">
                      {s.currentGrade ? `Grade ${s.currentGrade}` : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`rounded-[2px] px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                          s.onboardingCompleted ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {s.onboardingCompleted ? "Complete" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-ep-muted">{s.studentType ?? "—"}</td>
                    <td className="px-4 py-2.5 text-ep-muted">
                      {s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
