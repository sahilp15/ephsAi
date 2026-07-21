/**
 * Club domain types.
 *
 * A `Club` is the canonical, official-grounded record for one EPHS club or
 * activity. Every school-specific field that is not officially available is
 * represented as `null` / `[]` (never invented) so the UI and chatbot can
 * clearly distinguish "officially known" from "Not listed".
 */

export type ClubCategory =
  | "STEM"
  | "Academic"
  | "Business"
  | "Service"
  | "Leadership"
  | "Cultural"
  | "Arts"
  | "Media"
  | "Civic"
  | "Recreation"
  | "Environmental"
  | "Faith"
  | "Affinity"
  | "Interest";

export interface Club {
  /** Stable slug id — safe to reference even if the display name is edited. */
  id: string;
  name: string;
  description: string;
  /**
   * Provenance of `description`: "official" = verbatim from the official page,
   * "general" = an accurate plain-language summary (not official wording).
   */
  descriptionSource: "official" | "general";
  category: ClubCategory | string;
  advisor: string | null;
  studentLeaders: string[];
  meetingDays: string[];
  meetingTime: string | null;
  meetingFrequency: string | null;
  location: string | null;
  /** Eligible grade levels as strings, e.g. ["9","10","11","12"]. */
  grades: string[];
  membershipRequirements: string | null;
  contactEmail: string | null;
  joinInstructions: string | null;
  website: string | null;
  registrationUrl: string | null;
  additionalNotes: string | null;
  sourceUrl: string;
  active: boolean;
}

export interface ClubsDataset {
  schema_version: string;
  dataset_id: string;
  generated_from: {
    source_url: string;
    method: string;
    note: string;
    retrieved: string;
  };
  categories: string[];
  clubs: Club[];
}

/** Fields an administrator may edit. `id` is immutable once created. */
export type ClubInput = Omit<Club, "id"> & { id?: string };
