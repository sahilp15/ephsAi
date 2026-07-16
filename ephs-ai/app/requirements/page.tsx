import type { Metadata } from "next";
import { getDataset } from "@/lib/catalog/store";
import { RequirementsClient } from "./RequirementsClient";

export const metadata: Metadata = { title: "Graduation Requirements" };

export default function RequirementsPage() {
  const rules = getDataset().graduation_rules;
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
    />
  );
}
