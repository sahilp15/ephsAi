"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStudent } from "@/lib/client/student-context";
import { DEFAULT_PROFILE, type StudentProfile } from "@/lib/domain/plan-types";
import {
  historyToPlanEntries,
  projectHistory,
  type AcademicRecordInput,
} from "@/lib/domain/academic-history";
import { smartMatch, extractKeywords } from "@/lib/domain/smart-match";
import type { FuturePlanEntry } from "@/lib/data/plan";
import { PlannerClient, type Recommendation } from "@/app/(app)/plan/PlannerClient";
import {
  readDemoRecords,
  readDemoFuture,
  readDemoMeta,
  createDemoPlannerPersistence,
  type DemoImportMeta,
} from "@/lib/demo/planner-store";

/**
 * The preview four-year plan. It renders the exact same `PlannerClient` the
 * authenticated app uses, but its data comes from the browser-only preview
 * store: confirmed transcript courses become completed history and edits are
 * persisted with a localStorage-backed `PlannerPersistence`. Recommendations
 * are computed client-side from the same deterministic engine.
 */
export function DemoPlanner() {
  const searchParams = useSearchParams();
  const { profile, catalogList, metaReady } = useStudent();
  const [records, setRecords] = useState<AcademicRecordInput[]>([]);
  const [storedFuture, setStoredFuture] = useState<FuturePlanEntry[]>([]);
  const [importMeta, setImportMeta] = useState<DemoImportMeta>({
    currentGrade: null,
    currentSchoolYear: null,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setRecords(readDemoRecords());
    setStoredFuture(readDemoFuture());
    setImportMeta(readDemoMeta());
    setLoaded(true);
  }, []);

  const persistence = useMemo(
    () => createDemoPlannerPersistence(() => {}),
    [],
  );

  const projection = useMemo(() => projectHistory(records), [records]);

  // The transcript is the better authority on where the student actually is:
  // the preview profile defaults to grade 9 for anyone who skipped onboarding,
  // which would strand a junior's in-progress courses in the wrong year.
  const currentGrade =
    importMeta.currentGrade ?? profile.currentGrade ?? DEFAULT_PROFILE.currentGrade;
  // Graduation follows from the current grade unless onboarding set it.
  const graduationYear = profile.graduationYear ?? DEFAULT_PROFILE.graduationYear;

  const history = useMemo(
    () => historyToPlanEntries(records, { currentGrade }),
    [records, currentGrade],
  );

  // A course that now appears in imported history must not also sit in the plan
  // as a future/recommended entry - that is what made an already-completed
  // course show up again as a senior-year recommendation.
  const initialFuture = useMemo(() => {
    const taken = new Set([
      ...projection.completedCourseIds,
      ...projection.inProgressCourseIds,
    ]);
    return storedFuture.filter((f) => !taken.has(f.courseId));
  }, [storedFuture, projection]);

  const recommendations: Recommendation[] = useMemo(() => {
    if (!metaReady || catalogList.length === 0) return [];
    const completedSet = new Set(projection.completedCourseIds);
    const plannedSet = new Set(initialFuture.map((f) => f.courseId));
    const smProfile: StudentProfile = {
      ...DEFAULT_PROFILE,
      displayName: profile.displayName,
      graduationYear,
      currentGrade: currentGrade as StudentProfile["currentGrade"],
      interests: profile.interests,
      careerIdeas: profile.careerIdeas,
      rigor: profile.rigor,
      apInterest: profile.apInterest,
      pathwayIds: profile.pathwayIds,
      completedCourseIds: projection.completedCourseIds,
    };
    return smartMatch({
      profile: smProfile,
      targetGrade: Math.min(12, currentGrade + 1),
      completedCourseIds: completedSet,
      plannedCourseIds: plannedSet,
      catalog: catalogList,
      queryKeywords: extractKeywords(
        [...profile.interests, ...profile.careerIdeas].join(" "),
      ),
      pathwayNames: [],
      limit: 6,
    }).map((r) => ({
      courseId: r.course.id,
      title: r.course.title,
      reasons: r.reasons,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metaReady, catalogList, projection, initialFuture, profile, graduationYear, currentGrade]);

  if (!loaded) {
    return (
      <p className="text-sm text-ep-muted">Loading your preview plan…</p>
    );
  }

  return (
    <PlannerClient
      profile={{
        graduationYear,
        currentGrade,
        completedCourseIds: projection.completedCourseIds,
      }}
      initialFuture={initialFuture}
      history={history}
      recommendations={recommendations}
      imported={searchParams.get("imported") === "1"}
      persistence={persistence}
    />
  );
}
