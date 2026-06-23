/**
 * EPHS AI Assistant — central brand configuration.
 *
 * This is the ONE place to change the product name, tagline, colors, links, and
 * key EPHS contacts. Editing values here updates them everywhere across the app
 * (and the Tailwind theme, which imports from this file).
 */
export const brand = {
  /** Product name. */
  name: "EPHS AI Assistant",
  /** Compact name for tight spaces (e.g. the logo wordmark). */
  shortName: "EPHS AI",
  /** Short tagline shown under the wordmark. */
  tagline: "Accurate, EPHS-specific answers for students & families.",
  /** One-line description for the hero and meta tags. */
  description:
    "A friendly assistant that answers Eden Prairie High School questions — courses, graduation, schedules, counselors, clubs, and important dates — using official EPHS information, and always points you to the real source.",

  /** School context (used in copy). */
  school: {
    name: "Eden Prairie High School",
    shortName: "EPHS",
    mascot: "Eagles",
    address: "17185 Valley View Road, Eden Prairie, MN 55346",
  },

  /** Verified key contacts (from the official EPHS course guide & site). */
  contacts: {
    mainOffice: "952-975-8000",
    attendanceLine: "952-975-8001",
    healthOffice: "952-975-8070",
    transportation: "952-975-7500",
    email: "EPHS@edenpr.org",
    studentHours: "8:35 a.m. – 3:20 p.m., Mon–Fri",
    officeHours: "7:30 a.m. – 4:00 p.m., Mon–Fri",
  },

  /** Brand palette. Keep contrast accessible (scarlet/ink on white). */
  colors: {
    scarlet: "#C8102E", // primary
    ink: "#1A1A1A", // near-black text
    scarletTint: "#FBEAEC", // light scarlet accent background
    white: "#FFFFFF",
  },

  /**
   * Links surfaced across the app. Official EPHS pages are the single source of
   * truth for `source_url` references and the footer.
   */
  links: {
    // Internal
    chat: "/chat",
    about: "/about",
    feedback: "/feedback",
    // Counselor scheduling (provided by EPHS)
    counselorBooking: "https://app.acuityscheduling.com/schedule/1c840dc8",
    // Official EPHS pages
    ephsHome: "https://www.edenpr.org/high-school",
    graduation: "https://my.edenpr.org/high-school/graduation",
    calendar: "https://my.edenpr.org/high-school/calendar",
    counselingTeam: "https://my.edenpr.org/high-school/counseling-team-at-ephs",
    courseSelectionHub: "https://www.edenpr.org/ephs-courses",
    registration: "https://my.edenpr.org/ephs-registration",
    parking: "https://my.edenpr.org/parking",
    mentalHealth: "https://my.edenpr.org/mental-health",
  },

  /** Attribution line. */
  madeBy: "Made for EPHS students & families.",
} as const;

export type Brand = typeof brand;
