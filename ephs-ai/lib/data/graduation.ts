import "server-only";
import { getDataset } from "@/lib/catalog/store";
import { getCourseMetaList } from "@/lib/catalog/meta";
import { buildGraduationReport, type GraduationReport } from "@/lib/domain/graduation-rules";
import { loadPlannerState, type PlannerState } from "./plan";

export interface StudentGraduation {
  report: GraduationReport;
  state: PlannerState;
  creditsEarned: number;
  creditsInProgress: number;
  creditsPlanned: number;
}

/**
 * Build the live graduation snapshot for a student from confirmed history and
 * the current plan. Recomputed on read, so it always reflects the latest
 * transcript confirmation, manual edits, and plan changes.
 */
export async function buildStudentGraduation(
  userId: string,
  graduationYear: number,
): Promise<StudentGraduation> {
  const state = await loadPlannerState(userId);
  const catalog = getCourseMetaList();
  const rules = getDataset().graduation_rules;
  const metaById = new Map(catalog.map((m) => [m.id, m]));

  const plannedOrCompletedIds = [
    ...state.projection.completedCourseIds,
    ...state.future.map((f) => f.courseId),
  ];

  const report = buildGraduationReport({
    profile: {
      graduationYear,
      completedCourseIds: state.projection.completedCourseIds,
    },
    plannedOrCompletedIds,
    catalog,
    qualifyingPersonalFinanceCourses:
      rules.class_of_2028_and_beyond.qualifying_personal_finance_courses ?? [],
    artsEligibleByDepartment:
      rules.arts_requirement.eligible_courses_by_department ?? {},
    rulesSourcePage:
      graduationYear <= 2027
        ? rules.class_of_2027.source_page
        : rules.class_of_2028_and_beyond.source_page,
  });

  // Estimate planned credits from catalog credit hints where numeric.
  let creditsPlanned = 0;
  for (const f of state.future) {
    const raw = metaById.get(f.courseId)?.creditsRaw;
    const n = raw ? Number.parseFloat(raw) : NaN;
    if (!Number.isNaN(n)) creditsPlanned += n;
  }

  return {
    report,
    state,
    creditsEarned: state.projection.creditsEarned,
    creditsInProgress: state.projection.creditsInProgress,
    creditsPlanned,
  };
}
