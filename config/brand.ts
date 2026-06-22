/**
 * Eddy — central brand configuration.
 *
 * This is the ONE place to change the product name, tagline, colors, and links.
 * Editing values here updates them everywhere across the app (and the Tailwind
 * theme, which imports from this file).
 */
export const brand = {
  /** Product / assistant name. */
  name: "Eddy",
  /** Short tagline shown under the wordmark. */
  tagline: "Your Eden Prairie High guide.",
  /** One-line description for the hero and meta tags. */
  description:
    "A friendly AI guide that answers Eden Prairie High School students' questions using official EPHS information — and always points you to the real source.",

  /** School context (used in copy). */
  school: {
    name: "Eden Prairie High School",
    shortName: "EPHS",
    mascot: "Eagles",
  },

  /** Brand palette. Keep contrast accessible (scarlet/ink on white). */
  colors: {
    scarlet: "#C8102E", // primary
    ink: "#1A1A1A", // near-black text
    scarletTint: "#FBEAEC", // light scarlet accent background
    white: "#FFFFFF",
  },

  /** Links surfaced in the footer and elsewhere. */
  links: {
    officialSite: "https://www.edenpr.org/ephs",
    about: "/about",
    feedback: "/feedback",
    chat: "/chat",
  },

  /** Attribution line. */
  madeBy: "Made by a student, for EPHS students.",
} as const;

export type Brand = typeof brand;
