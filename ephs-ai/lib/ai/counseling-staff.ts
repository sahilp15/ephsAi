import "server-only";

/**
 * EPHS counseling Student Support Teams (SSTs), keyed by the first letters of a
 * student's last name.
 *
 * Source: the official EPHS Counseling Team roster (Student Centers 1-3).
 * Students are assigned to a counselor, social worker, and dean by the first
 * letters of their last name. This module lets the chat assistant tell a
 * signed-in student exactly who their counselor, social worker, and dean are.
 *
 * Ranges are stored as inclusive lowercase last-name prefixes. Staff and phone
 * numbers change year to year, so the assistant presents them as "as published"
 * and always offers the main counseling office line (952-975-6940) and the
 * official directory for confirmation.
 */

export const COUNSELING_OFFICE_PHONE = "952-975-6940";
export const COUNSELOR_SCHEDULING_URL =
  "https://app.acuityscheduling.com/schedule/1c840dc8";
export const COUNSELING_DIRECTORY_URL =
  "https://my.edenpr.org/high-school/counseling-team-at-ephs";

export interface CounselorAssignment {
  name: string;
  phone: string;
  /** Inclusive last-name range, lowercase prefixes, e.g. "a" to "ben". */
  rangeStart: string;
  rangeEnd: string;
  /** Human-readable range label as published, e.g. "A-Ben". */
  rangeLabel: string;
}

export interface StudentCenter {
  /** Student Center number as published (1, 2, or 3). */
  center: number;
  /** Coarse last-name band the center serves, e.g. "A-G". */
  band: string;
  counselors: CounselorAssignment[];
  socialWorker: { name: string; phone: string };
  /** Dean assigned to this band. Marked "as published" - confirm with office. */
  dean: { name: string; band: string };
  officeProfessionals: string[];
}

/**
 * The three EPHS Student Centers. Counselor ranges are listed in the published
 * order; a name is matched to the first counselor whose inclusive range
 * contains it (see findAssignment).
 *
 * Dean assignments (A-G, H-N, O-Z) are as published on the district site and
 * may change; they are surfaced with a "confirm" note.
 */
export const STUDENT_CENTERS: StudentCenter[] = [
  {
    center: 1,
    band: "A-G",
    counselors: [
      { name: "Anthea Amsler", phone: "952-975-8031", rangeStart: "a", rangeEnd: "ben", rangeLabel: "A-Ben" },
      { name: "Rachel Schmidt", phone: "952-975-8027", rangeStart: "beo", rangeEnd: "di", rangeLabel: "Beo-Di" },
      { name: "Cynthia Leiva", phone: "952-975-8039", rangeStart: "dj", rangeEnd: "g", rangeLabel: "Dj-G" },
    ],
    socialWorker: { name: "Elizabeth Griffin", phone: "952-975-8028" },
    dean: { name: "Sally Ratemo", band: "A-G" },
    officeProfessionals: ["Julie Johnson"],
  },
  {
    center: 2,
    band: "H-N",
    counselors: [
      { name: "Lenny Moskowitz", phone: "952-975-8032", rangeStart: "h", rangeEnd: "joh", rangeLabel: "H-Joh" },
      { name: "Jadyn Biermaier", phone: "952-975-8398", rangeStart: "joi", rangeEnd: "mari", rangeLabel: "Joi-Mari" },
      { name: "Amy Harnack", phone: "952-975-8038", rangeStart: "marj", rangeEnd: "n", rangeLabel: "Marj-N" },
    ],
    socialWorker: { name: "Emily Pulford", phone: "952-975-8014" },
    dean: { name: "Justin Timm", band: "H-N" },
    officeProfessionals: ["Gail Gordon", "Alexandra Ourada"],
  },
  {
    center: 3,
    band: "O-Z",
    counselors: [
      { name: "Jennifer Hanson", phone: "952-975-8035", rangeStart: "mot", rangeEnd: "ra", rangeLabel: "Mot-Ra" },
      { name: "Lisa Quiring", phone: "952-975-8033", rangeStart: "rot", rangeEnd: "s", rangeLabel: "Rot-S" },
      { name: "Mark Otis", phone: "952-975-8075", rangeStart: "t", rangeEnd: "z", rangeLabel: "T-Z" },
    ],
    socialWorker: { name: "Olivia Murphy", phone: "952-975-8056" },
    dean: { name: "Nate Beulah", band: "O-Z" },
    officeProfessionals: ["Lynn Morrow", "Zoe Callinan"],
  },
];

export interface AssignedTeam {
  lastName: string;
  center: number;
  band: string;
  counselor: CounselorAssignment;
  socialWorker: { name: string; phone: string };
  dean: { name: string; band: string };
}

/** Normalize a raw last name for range comparison (lowercase letters only). */
function normalizeLastName(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z].*$/, "");
}

/**
 * Extract a last name from a display name. Takes the final whitespace-separated
 * token so "Jordan Lee" -> "Lee" and a lone "Jordan" -> "Jordan".
 */
export function lastNameFromDisplayName(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  return parts.length ? parts[parts.length - 1]! : "";
}

function teamFor(center: StudentCenter, counselor: CounselorAssignment, lastName: string): AssignedTeam {
  return {
    lastName,
    center: center.center,
    band: center.band,
    counselor,
    socialWorker: center.socialWorker,
    dean: center.dean,
  };
}

/**
 * Best-effort assignment lookup. Returns the counselor for the given last name
 * plus the center's social worker and dean, or null when the name is empty or
 * has no letters.
 *
 * Two passes handle the quirks of the published roster:
 *
 * 1. Inclusive range match. Pick the first counselor whose [start, end] range
 *    contains the name. The published ranges overlap in one spot ("Marj-N" and
 *    "Mot-Ra"), and order matters there: an N-name like "Nguyen" is <= "N" so it
 *    belongs to Harnack (Marj-N), listed first, as the roster intends.
 * 2. Nearest-preceding fallback. A few names fall in a gap between published
 *    ranges (one counselor ends at "Ra", the next starts at "Rot", leaving
 *    "Reed"/"Robinson" uncovered). For those, assign the counselor with the
 *    greatest range-start that is still <= the name.
 *
 * Results are "as published"; the assistant always offers the office line to
 * confirm.
 */
export function findAssignment(lastNameRaw: string): AssignedTeam | null {
  const name = normalizeLastName(lastNameRaw);
  if (!name) return null;
  const trimmed = lastNameRaw.trim();

  // Pass 1: inclusive [start, end] match (end prefix is inclusive of names that
  // start with it, e.g. "n" covers "nguyen").
  for (const center of STUDENT_CENTERS) {
    for (const counselor of center.counselors) {
      const afterStart = name >= counselor.rangeStart;
      const beforeEnd =
        name <= counselor.rangeEnd || name.startsWith(counselor.rangeEnd);
      if (afterStart && beforeEnd) return teamFor(center, counselor, trimmed);
    }
  }

  // Pass 2: gap fallback - nearest counselor whose range-start precedes the name.
  let nearest: AssignedTeam | null = null;
  for (const center of STUDENT_CENTERS) {
    for (const counselor of center.counselors) {
      if (name >= counselor.rangeStart) nearest = teamFor(center, counselor, trimmed);
    }
  }
  return nearest;
}

/**
 * Render the counseling-staff roster for the system prompt as compact JSON,
 * consistent with the other DATA blocks. When the signed-in student's last
 * name is known, the pre-computed assignment is included so the assistant can
 * answer "who is my counselor?" directly.
 */
export function buildCounselingStaffBlock(lastName?: string): string {
  const roster = STUDENT_CENTERS.map((c) => ({
    studentCenter: c.center,
    lastNameBand: c.band,
    counselors: c.counselors.map((k) => ({
      name: k.name,
      lastNameRange: k.rangeLabel,
      directLine: k.phone,
    })),
    socialWorker: c.socialWorker,
    dean: `${c.dean.name} (last names ${c.dean.band}, as published; confirm with the office)`,
    officeProfessionals: c.officeProfessionals,
  }));

  const assigned = lastName ? findAssignment(lastName) : null;
  const assignedBlock = assigned
    ? {
        forLastName: assigned.lastName,
        studentCenter: assigned.center,
        counselor: `${assigned.counselor.name} (${assigned.counselor.rangeLabel}), ${assigned.counselor.phone}`,
        socialWorker: `${assigned.socialWorker.name}, ${assigned.socialWorker.phone}`,
        dean: `${assigned.dean.name} (as published; confirm)`,
      }
    : lastName
      ? "Could not resolve this last name to a counselor; share the roster and point the student to the counseling office to confirm."
      : "No signed-in last name available; ask the student for their last name to identify their counselor, or share the full roster.";

  return [
    "DATA: EPHS COUNSELING STUDENT SUPPORT TEAMS (official roster. Each student is assigned a counselor, social worker, and dean by the FIRST LETTERS of their LAST NAME. Use this to tell a student who their counselor/dean/social worker is. Staff and direct lines are as published and can change year to year, so present them as 'as published' and offer the main counseling office line and the directory to confirm.)",
    JSON.stringify({
      mainCounselingOffice: COUNSELING_OFFICE_PHONE,
      scheduleAppointmentUrl: COUNSELOR_SCHEDULING_URL,
      directoryUrl: COUNSELING_DIRECTORY_URL,
      assignedForThisStudent: assignedBlock,
      fullRoster: roster,
    }),
  ].join("\n");
}
