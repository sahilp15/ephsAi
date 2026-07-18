import type { Metadata } from "next";
import { requireStudent } from "@/lib/auth/session";
import { loadPlannerState } from "@/lib/data/plan";
import { getCourseMetaList } from "@/lib/catalog/meta";
import { getPathways } from "@/lib/catalog/store";
import { smartMatch, extractKeywords } from "@/lib/domain/smart-match";
import { DEFAULT_PROFILE, type StudentProfile } from "@/lib/domain/plan-types";
import { PageHeader } from "@/components/ui";
import { PlannerClient, type Recommendation } from "./PlannerClient";

export const metadata: Metadata = { title: "Four-Year Plan" };
export const dynamic = "force-dynamic";

export default async function PlanPage({
  searchParams,
}: {
  searchParams: { imported?: string };
}) {
  const user = await requireStudent();
  const state = await loadPlannerState(user.id);
  const p = user.profile;

  const graduationYear = p?.graduation_year ?? DEFAULT_PROFILE.graduationYear;
  const currentGrade = p?.current_grade ?? DEFAULT_PROFILE.currentGrade;

  // Recommendations from the deterministic engine, informed by confirmed history.
  const catalog = getCourseMetaList();
  const pathwayNames = getPathways()
    .filter((pw) => (p?.pathway_interests ?? []).includes(pw.id))
    .map((pw) => pw.name);
  const completedSet = new Set(state.projection.completedCourseIds);
  const plannedSet = new Set(state.future.map((f) => f.courseId));

  const smProfile: StudentProfile = {
    ...DEFAULT_PROFILE,
    displayName: p?.display_name ?? "",
    graduationYear,
    currentGrade: currentGrade as StudentProfile["currentGrade"],
    interests: p?.interests ?? [],
    careerIdeas: p?.career_ideas ?? [],
    rigor: p?.rigor ?? "balanced",
    apInterest: p?.ap_interest ?? false,
    pathwayIds: p?.pathway_interests ?? [],
    completedCourseIds: state.projection.completedCourseIds,
  };

  const recommendations: Recommendation[] = smartMatch({
    profile: smProfile,
    targetGrade: Math.min(12, currentGrade + 1),
    completedCourseIds: completedSet,
    plannedCourseIds: plannedSet,
    catalog,
    queryKeywords: extractKeywords(
      [...(p?.interests ?? []), ...(p?.career_ideas ?? [])].join(" "),
    ),
    pathwayNames,
    limit: 6,
  }).map((r) => ({ courseId: r.course.id, title: r.course.title, reasons: r.reasons }));

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Plan every term"
        title="Your four-year plan"
        lede="Completed courses from your transcript appear as history. Drag your future courses between terms, lock the ones you're sure about, and we'll check eligibility and prerequisites after every change."
      />
      <PlannerClient
        profile={{
          graduationYear,
          currentGrade,
          completedCourseIds: state.projection.completedCourseIds,
        }}
        initialFuture={state.future}
        history={state.history}
        recommendations={recommendations}
        imported={searchParams.imported === "1"}
      />
    </div>
  );
}
