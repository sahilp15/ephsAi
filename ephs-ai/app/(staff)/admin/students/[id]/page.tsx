import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { adminGetStudent } from "@/lib/data/admin";
import { logAudit } from "@/lib/auth/audit";
import { getCourseById } from "@/lib/catalog/store";

export const metadata: Metadata = { title: "Admin · Student" };
export const dynamic = "force-dynamic";

export default async function AdminStudentPage({ params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  const detail = await adminGetStudent(params.id);
  if (!detail) notFound();

  // Least-privilege: record that an administrator viewed this student.
  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "admin.view_student",
    target: params.id,
    targetStudentId: params.id,
  });

  const { profile, onboarding, transcripts, records } = detail;

  return (
    <div className="space-y-6">
      <Link href="/admin" className="text-sm font-semibold text-ep-muted hover:text-ep-charcoal">
        ← Back to students
      </Link>

      <section className="rounded-xl border border-ep-border-soft bg-white p-5 shadow-card">
        <h2 className="text-xl font-bold text-ep-charcoal">{profile.display_name || "Student"}</h2>
        <dl className="mt-3 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          <Row label="Email">{profile.email}</Row>
          <Row label="Grade / Class">
            {profile.current_grade ? `Grade ${profile.current_grade}` : "—"} · Class of{" "}
            {profile.graduation_year ?? "—"}
          </Row>
          <Row label="School">{profile.current_school ?? "—"}</Row>
          <Row label="Counselor">{profile.counselor_name ?? "—"}</Row>
          <Row label="Onboarding">{profile.onboarding_completed ? "Complete" : "Pending"}</Row>
          <Row label="Student type">{profile.student_type ?? "—"}</Row>
        </dl>
      </section>

      {onboarding ? (
        <section className="rounded-xl border border-ep-border-soft bg-white p-5 shadow-card">
          <h3 className="text-sm font-bold uppercase tracking-wide text-ep-faint">Onboarding responses</h3>
          <dl className="mt-2 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            <Row label="Goals">{onboarding.goals || "—"}</Row>
            <Row label="Schedule preference">{onboarding.schedule_preference}</Row>
            <Row label="Programs">{onboarding.program_interests.join(", ") || "—"}</Row>
            <Row label="Post-grad plan">{onboarding.post_grad_plan ?? "—"}</Row>
            <Row label="Favorite subjects">{onboarding.favorite_subjects.join(", ") || "—"}</Row>
            <Row label="Challenging subjects">{onboarding.challenging_subjects.join(", ") || "—"}</Row>
          </dl>
        </section>
      ) : null}

      <section className="rounded-xl border border-ep-border-soft bg-white p-5 shadow-card">
        <h3 className="text-sm font-bold uppercase tracking-wide text-ep-faint">
          Transcripts ({transcripts.length})
        </h3>
        {transcripts.length === 0 ? (
          <p className="mt-2 text-sm text-ep-muted">No transcripts uploaded.</p>
        ) : (
          <ul className="mt-2 space-y-1.5 text-sm">
            {transcripts.map((t) => (
              <li key={t.id} className="flex items-center justify-between">
                <span className="text-ep-ink">{t.original_filename}</span>
                <span className="text-xs font-semibold uppercase text-ep-faint">{t.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-ep-border-soft bg-white p-5 shadow-card">
        <h3 className="text-sm font-bold uppercase tracking-wide text-ep-faint">
          Academic records ({records.length})
        </h3>
        {records.length === 0 ? (
          <p className="mt-2 text-sm text-ep-muted">No academic history yet.</p>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-ep-faint">
                  <th className="py-1.5 pr-4">Course</th>
                  <th className="py-1.5 pr-4">Match</th>
                  <th className="py-1.5 pr-4">Type</th>
                  <th className="py-1.5 pr-4">Grade lvl</th>
                  <th className="py-1.5 pr-4">Credits</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-t border-ep-border-soft">
                    <td className="py-1.5 pr-4 text-ep-ink">{r.original_course_name ?? "—"}</td>
                    <td className="py-1.5 pr-4 text-ep-muted">
                      {r.course_id ? getCourseById(r.course_id)?.title ?? r.course_id : "—"}
                    </td>
                    <td className="py-1.5 pr-4 text-ep-muted">{r.record_type}</td>
                    <td className="py-1.5 pr-4 text-ep-muted">{r.grade_level ?? "—"}</td>
                    <td className="py-1.5 pr-4 text-ep-muted">{r.credits_earned ?? "—"}</td>
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

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-ep-faint">{label}</dt>
      <dd className="text-ep-ink">{children}</dd>
    </div>
  );
}
