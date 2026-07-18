import type { Metadata } from "next";
import { getDataset } from "@/lib/catalog/store";
import { getSessionUser } from "@/lib/auth/session";
import { loadPlannerState } from "@/lib/data/plan";
import { DEFAULT_PROFILE } from "@/lib/domain/plan-types";
import { RequirementsClient } from "./RequirementsClient";

export const metadata: Metadata = { title: "Graduation Requirements" };
export const dynamic = "force-dynamic";

export default async function RequirementsPage() {
  const rules = getDataset().graduation_rules;

  // Personalize from the student's confirmed history + plan when signed in.
  const user = await getSessionUser();
  let graduationYear = DEFAULT_PROFILE.graduationYear;
  let completedCourseIds: string[] = [];
  let plannedCourseIds: string[] = [];
  if (user && user.role === "student") {
    graduationYear = user.profile?.graduation_year ?? graduationYear;
    const state = await loadPlannerState(user.id);
    completedCourseIds = state.projection.completedCourseIds;
    plannedCourseIds = state.future.map((f) => f.courseId);
  }

  return (
    <RequirementsClient
      qualifyingPersonalFinanceCourses={
        rules.class_of_2028_and_beyond.qualifying_personal_finance_courses
      }
      artsEligibleByDepartment={
        rules.arts_requirement.eligible_courses_by_department
      }
      rulesSourcePage={rules.class_of_2027.source_page}
      sourceOfTruthNote={rules.source_of_truth_note}
      graduationYear={graduationYear}
      completedCourseIds={completedCourseIds}
      plannedCourseIds={plannedCourseIds}
    />
  );
}
