import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { getCourses } from "@/lib/catalog/store";
import { adminListCourseOverrides } from "@/lib/catalog/overrides";
import { clubsPersistenceAvailable } from "@/lib/clubs/store";
import { WarningBanner } from "@/components/ui";
import { CoursesManager, type CourseOverrideMap, type CourseSummary } from "@/components/admin/CoursesManager";

export const metadata: Metadata = { title: "Manage Courses" };
export const dynamic = "force-dynamic";

export default async function AdminCoursesPage() {
  await requireAdmin(); // Defense in depth; the layout already gates.
  const [overrides] = await Promise.all([adminListCourseOverrides()]);
  const persistence = clubsPersistenceAvailable();

  const courses: CourseSummary[] = getCourses().map((c) => ({
    id: c.id,
    title: c.title,
    department: c.primary_department,
    termLength: c.term_length_interpretation,
  }));

  const initialOverrides: CourseOverrideMap = {};
  for (const [id, o] of overrides) {
    initialOverrides[id] = { active: o.active, termCount: o.termCount, note: o.note };
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-ep-charcoal">Manage course availability</h2>
        <p className="mt-0.5 text-sm text-ep-muted">
          Activate or deactivate courses for students and override a course&rsquo;s
          duration. Course text and descriptions are maintained through the
          data-import pipeline; this panel manages availability and duration only.
        </p>
      </div>

      {!persistence ? (
        <WarningBanner severity="info" title="Read-only">
          Supabase is not configured in this environment, so course overrides
          cannot be saved. Configure Supabase to manage availability and duration.
        </WarningBanner>
      ) : null}

      <CoursesManager
        courses={courses}
        initialOverrides={initialOverrides}
        persistence={persistence}
      />
    </div>
  );
}
