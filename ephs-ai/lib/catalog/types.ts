/**
 * Types mirroring the authoritative dataset:
 * data/ephs-course-guide-2026-27.json (extracted from the official
 * "Eden Prairie High School Course Guide 2026-27" PDF).
 *
 * Source-of-truth rule: nothing outside this dataset may be presented as
 * EPHS fact. Fields the guide does not provide are omitted or labeled as
 * requiring counselor verification.
 */

export interface CourseFlags {
  new_course: boolean;
  ap: boolean;
  honors: boolean;
  capstone: boolean;
  skinny: boolean;
  cis: boolean;
}

export interface CourseDataQuality {
  requires_counselor_verification: boolean;
  conflicts_detected: unknown[];
}

export interface CourseAppearance {
  appearance_id: string;
  raw_title: string;
  title: string;
  department: string;
  source_page: number;
  source_column: number | null;
  description: string;
  prerequisite_raw: string | null;
  grades_raw: string | null;
  grades_allowed: number[];
  credits_raw: string | null;
  term_length_interpretation: string | null;
  graduation_requirements_fulfilled_raw: string[];
  notes: string[];
  college_credit_available: boolean;
  college_credit_raw: string[];
  flags: CourseFlags;
  full_entry_text?: string;
}

export interface Course {
  id: string;
  title: string;
  raw_titles_seen: string[];
  departments: string[];
  primary_department: string;
  description: string;
  prerequisite_raw: string | null;
  grades_raw: string | null;
  grades_allowed: number[];
  credits_raw: string | null;
  term_length_interpretation: string | null;
  graduation_requirements_fulfilled_raw: string[];
  notes: string[];
  college_credit_available: boolean;
  college_credit_raw: string[];
  flags: CourseFlags;
  pathways: string[];
  source_pages: number[];
  source_appearances: CourseAppearance[];
  data_quality: CourseDataQuality;
}

export interface PathwayCourseRef {
  name: string;
  raw_entry: string;
  markers_raw: string[];
}

export interface Pathway {
  id: string;
  name: string;
  description: string;
  capstones: PathwayCourseRef[];
  supporting_courses: PathwayCourseRef[];
  resolved_course_ids: string[];
  unresolved_or_external_course_names: string[];
  source_pages: number[];
}

export interface GraduationRules {
  source_of_truth_note: string;
  class_of_2027: {
    technology_credit_required: boolean;
    personal_finance_credit_required: boolean;
    source_page: number;
  };
  class_of_2028_and_beyond: {
    technology_credit_required: boolean;
    personal_finance_credit_required: boolean;
    qualifying_personal_finance_courses: string[];
    source_page: number;
  };
  arts_requirement: {
    eligible_courses_by_department: Record<string, string[]>;
    source_page?: number;
    source_pages?: number[];
    [key: string]: unknown;
  };
  course_level_statements: string;
}

export interface SourcePage {
  page: number;
  title: string;
  raw_layout_text: string;
}

export interface SchoolProgram {
  [key: string]: unknown;
  description?: string;
  source_pages?: number[];
  source_page?: number;
}

export interface CourseGuideDataset {
  schema_version: string;
  dataset_id: string;
  generated_from: {
    filename: string;
    document_title: string;
    page_count: number;
    pdf_sha256: string;
    extraction_note: string;
  };
  branding: {
    school_name: string;
    short_name: string;
    colors_extracted_from_pdf: Record<string, string>;
    logo_policy: string;
  };
  academic_calendar_model: {
    terms_per_school_year: number;
    semester_definition: string;
    source_pages: number[];
  };
  graduation_rules: GraduationRules;
  pathway_overview: {
    source_page: number;
    description: string;
    benefits: string[];
  };
  pathways: Pathway[];
  programs: Record<string, SchoolProgram>;
  courses: Course[];
  course_appearances: CourseAppearance[];
  indexes: Record<string, unknown>;
  source_pages: SourcePage[];
  known_limitations: string[];
}
