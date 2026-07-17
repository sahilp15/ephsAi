import type { PlanEntry, StudentProfile } from "@/lib/domain/plan-types";

/**
 * Seeded demo students for leadership presentations. All three are clearly
 * fictional and every course id below exists in the 2026-27 dataset. Each
 * profile includes at least one eligibility warning and at least one
 * counselor-verification item by construction (e.g. planned courses whose
 * prerequisites are not yet complete, or audition/application courses).
 */

export interface DemoStudent {
  id: string;
  profile: StudentProfile;
  plan: PlanEntry[];
  counselorNotes: string[];
  exampleQuestions: string[];
}

export const DEMO_STUDENTS: DemoStudent[] = [
  {
    id: "demo-engineering",
    profile: {
      displayName: "Demo Student - Engineering",
      graduationYear: 2030,
      currentGrade: 9,
      interests: ["engineering", "robotics", "physics", "computer science"],
      careerIdeas: ["mechanical engineer", "software engineer"],
      rigor: "challenging",
      apInterest: true,
      pathwayIds: ["engineering-technology-manufacturing"],
      completedCourseIds: [
        "earth-and-space-science-a-and-b",
        "english-9-a-and-b",
        "introduction-to-engineering-design-a-and-b",
      ],
      unmatchedHistory: ["Algebra 8 (middle school)"],
      onboardingCompleted: true,
    },
    plan: [
      {
        id: "eng-1",
        courseId: "honors-biology-a-and-b",
        gradeYear: 10,
        startTerm: 1,
        termSpan: 2,
        status: "planned",
      },
      {
        id: "eng-2",
        courseId: "robotics-and-automation",
        gradeYear: 10,
        startTerm: 3,
        termSpan: 1,
        status: "planned",
      },
      {
        // Eligibility warning by design: prerequisite chain not yet complete.
        id: "eng-3",
        courseId: "ap-computer-science-a-java-a-and-b",
        gradeYear: 10,
        startTerm: 3,
        termSpan: 2,
        status: "considering",
      },
      {
        // Counselor-verification item: multi-course prerequisite wording.
        id: "eng-4",
        courseId: "principles-of-engineering-a-and-b-capstone",
        gradeYear: 11,
        startTerm: 1,
        termSpan: 2,
        status: "considering",
      },
    ],
    counselorNotes: [
      "Interested in the Engineering, Technology & Manufacturing capstone sequence - review math placement before junior year.",
    ],
    exampleQuestions: [
      "I love robotics and want to become a mechanical engineer. What should I take in 10th grade?",
      "Can I take AP Computer Science A next year?",
    ],
  },
  {
    id: "demo-business",
    profile: {
      displayName: "Demo Student - Business",
      graduationYear: 2029,
      currentGrade: 10,
      interests: ["business", "marketing", "entrepreneurship", "investing"],
      careerIdeas: ["marketing manager", "entrepreneur"],
      rigor: "balanced",
      apInterest: true,
      pathwayIds: ["business-management"],
      completedCourseIds: [
        "business-principles",
        "english-9-a-and-b",
        "human-geography-9-a-and-b",
        "earth-and-space-science-a-and-b",
      ],
      unmatchedHistory: [],
      onboardingCompleted: true,
    },
    plan: [
      {
        id: "bus-1",
        courseId: "marketing-strategies",
        gradeYear: 11,
        startTerm: 1,
        termSpan: 1,
        status: "planned",
      },
      {
        // Class of 2028+ personal finance requirement - planned senior year.
        id: "bus-2",
        courseId: "personal-finance",
        gradeYear: 12,
        startTerm: 1,
        termSpan: 1,
        status: "planned",
      },
      {
        // Eligibility warning by design: Marketing Strategies prerequisite
        // is planned but Digital & Social Media Marketing starts same year.
        id: "bus-3",
        courseId: "digital-and-social-media-marketing",
        gradeYear: 11,
        startTerm: 1,
        termSpan: 1,
        status: "considering",
      },
      {
        id: "bus-4",
        courseId: "ap-psychology-a-and-b",
        gradeYear: 11,
        startTerm: 2,
        termSpan: 2,
        status: "considering",
      },
    ],
    counselorNotes: [
      "Confirm personal-finance requirement timing (Class of 2028 and beyond rule).",
    ],
    exampleQuestions: [
      "I want to run my own business someday. Which courses support the Business & Management pathway?",
      "I want one AP class junior year but not an overloaded schedule.",
    ],
  },
  {
    id: "demo-arts",
    profile: {
      displayName: "Demo Student - Communication & Arts",
      graduationYear: 2030,
      currentGrade: 9,
      interests: ["theatre", "film", "writing", "photography"],
      careerIdeas: ["journalist", "filmmaker"],
      rigor: "standard",
      apInterest: false,
      pathwayIds: ["communication-arts"],
      completedCourseIds: [
        "english-9-a-and-b",
        "digital-photography-i",
        "acting-improvisation-and-comedy",
      ],
      unmatchedHistory: [],
      onboardingCompleted: true,
    },
    plan: [
      {
        id: "art-1",
        courseId: "acting-and-theatre-arts",
        gradeYear: 10,
        startTerm: 1,
        termSpan: 1,
        status: "planned",
      },
      {
        id: "art-2",
        courseId: "digital-photography-ii",
        gradeYear: 10,
        startTerm: 2,
        termSpan: 1,
        status: "planned",
      },
      {
        id: "art-3",
        courseId: "introduction-to-21st-century-journalism",
        gradeYear: 10,
        startTerm: 3,
        termSpan: 1,
        status: "planned",
      },
      {
        // Counselor-verification item by design: yearbook requires an application.
        id: "art-4",
        courseId: "advanced-journalism-yearbook",
        gradeYear: 11,
        startTerm: 1,
        termSpan: 1,
        status: "considering",
      },
      {
        // Eligibility warning by design: Advanced Acting needs Acting & Theatre Arts first.
        id: "art-5",
        courseId: "advanced-acting",
        gradeYear: 10,
        startTerm: 2,
        termSpan: 1,
        status: "considering",
      },
    ],
    counselorNotes: [
      "Ask about the yearbook application timeline during registration week.",
    ],
    exampleQuestions: [
      "I love theatre and photography. What should I plan for 10th grade?",
      "What courses count toward the arts requirement?",
    ],
  },
];

export function getDemoStudent(id: string): DemoStudent | undefined {
  return DEMO_STUDENTS.find((s) => s.id === id);
}
