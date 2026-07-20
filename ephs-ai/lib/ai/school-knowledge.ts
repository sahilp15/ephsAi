import "server-only";

/**
 * Curated, general Eden Prairie High School reference knowledge for the chat
 * assistant.
 *
 * This is a deliberately separate layer from the Course Guide dataset. The
 * guide is the sole authority for course facts (prerequisites, credits,
 * pathways, graduation rules); this module supplies the surrounding
 * school-operations knowledge students commonly ask about, drawn from the
 * public Eden Prairie Schools website (edenpr.org / my.edenpr.org).
 *
 * Operational details like calendar dates, staff, and phone numbers change
 * year to year, so the prompt instructs the assistant to present them as "as
 * published" and to point students to the official calendar and the counseling
 * office for confirmation, never as guaranteed. The counselor-scheduling link
 * is the one action we always surface.
 */

/** Counselor appointment scheduling. Always redirect scheduling requests here. */
export const COUNSELOR_SCHEDULING_URL =
  "https://app.acuityscheduling.com/schedule/1c840dc8";

export const EPHS_SCHOOL_INFO = {
  general: {
    name: "Eden Prairie High School (EPHS)",
    district: "Eden Prairie Schools, Independent School District 272",
    location: "Eden Prairie, Minnesota",
    address: "17185 Valley View Road, Eden Prairie, MN 55346",
    mainPhone: "952-975-8000",
    email: "EPHS@edenpr.org",
    gradeLevels: "9-12",
    principal: "Dr. Jaysen Anderson",
    mascot: "Eagles",
    colors: "Scarlet (red) and black",
    approxEnrollment: "about 2,800 students (one of Minnesota's largest high schools)",
    studentHours: "8:35 a.m. to 3:20 p.m., Monday through Friday",
    mainOfficeHours: "7:30 a.m. to 4:00 p.m., Monday through Friday",
    websites: {
      district: "https://www.edenpr.org",
      highSchool: "https://www.edenpr.org/high-school",
      familyPortal: "https://my.edenpr.org/high-school",
      athletics: "https://eagles.edenpr.org/athletics",
    },
  },

  counseling: {
    howItWorks:
      "Students are assigned by the first letter of their last name to a Student Support Team (SST) that includes a school counselor, dean, associate principal, and social worker.",
    helpsWith:
      "course selection and registration, graduation-requirement questions, college and career planning (AP, CIS, PSEO, Pathways), postsecondary options, and social-emotional and mental-health support.",
    officePhone: "952-975-6940",
    officeHours: "8:00 a.m. to 4:00 p.m., Monday through Friday",
    schedulingUrl: COUNSELOR_SCHEDULING_URL,
    schedulingNote:
      "Students book appointments with a counselor, social worker, or dean online through this scheduling page.",
  },

  academics: {
    ap: "EPHS offers 20+ Advanced Placement (AP) courses.",
    cis: "College in the Schools (CIS) courses offer college credit through partner universities.",
    pseo: "Postsecondary Enrollment Options (PSEO) let eligible grade 10-12 students earn college and high school credit at participating colleges.",
    pathways:
      "EPHS runs interest-area Pathways with hands-on learning and community/business partnerships, plus Capstone opportunities. Pathways are open to all students, not test-in.",
    avid: "AVID is offered to support college readiness.",
    athletics:
      "Eagles athletics compete in the Lake Conference of the Minnesota State High School League (MSHSL).",
    note: "For exact graduation credit requirements and course specifics, rely on the Course Guide data and confirm with a counselor.",
  },

  keyContacts: {
    attendanceLine: "952-975-8001 (or submit attendance at my.edenpr.org/attendance)",
    healthOfficeNurse: "952-975-8070",
    technologyHelpDesk: "952-975-7094 (helpline@edenpr.org)",
    staffDirectory: "https://my.edenpr.org/directory",
  },

  registration: {
    summary:
      "Course registration for the next school year typically runs in late January through mid-February in Infinite Campus, with grade-level meetings, a Course Selection Open House, and planning materials distributed by counselors.",
    hub: "https://my.edenpr.org/ephs-registration",
    note: "Exact registration dates change each year; confirm current dates with the counseling office or the registration hub.",
  },

  // Calendar highlights as published by the district. Dates can shift, so the
  // assistant must present them as "as published" and point students to the
  // official calendar for confirmation.
  calendar: {
    officialCalendarUrl: "https://my.edenpr.org/calendars",
    "2025-26": {
      firstDay:
        "September 2, 2025 (grades 6 and 9) and September 3, 2025 (grades 7-8 and 10-12)",
      noSchool: [
        "Labor Day: September 1, 2025",
        "MEA / fall break: October 16-17, 2025",
        "Grading day (grades 6-12): November 7, 2025",
        "Thanksgiving break: November 26-28, 2025",
        "Winter break: December 22, 2025 to January 2, 2026",
        "Martin Luther King Jr. Day: January 19, 2026",
        "Grading day (PreK-12): January 26, 2026",
      ],
      ephsConferences: "December 16, 2025, 4-8 p.m.",
      graduationClassOf2026: "Saturday, June 6, 2026, at U.S. Bank Stadium, Minneapolis",
      verify:
        "Exact spring break and the last day of school for 2025-26 should be confirmed on the official calendar.",
    },
    "2026-27": {
      firstDay:
        "September 8, 2026 (grades 6 and 9) and September 9, 2026 (grades 7-8 and 10-12)",
      noSchool: [
        "Labor Day: September 7, 2026",
        "MEA / fall break: October 15-16, 2026",
        "Thanksgiving break: November 25-27, 2026",
        "Winter break: begins December 23, 2026",
        "Spring break: April 5-9, 2027",
      ],
      lastDay: "June 10, 2027 (as published; verify)",
      note: "The 2026-27 calendar is preliminary and subject to change.",
    },
  },
} as const;

/**
 * Render the school-knowledge block for the system prompt. Kept compact and
 * JSON-shaped so it reads as reference data, consistent with the other DATA
 * blocks in the prompt.
 */
export function buildSchoolKnowledgeBlock(): string {
  return [
    "DATA: EPHS SCHOOL INFORMATION (general school operations from the public Eden Prairie Schools website; use for non-course questions such as contacts, counseling, programs overview, and calendar. Course facts still come only from the Course Guide data.)",
    JSON.stringify(EPHS_SCHOOL_INFO),
  ].join("\n");
}
