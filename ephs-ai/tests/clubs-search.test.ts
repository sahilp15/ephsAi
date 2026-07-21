import { describe, expect, it } from "vitest";
import { searchClubs, meetingDaysOf } from "@/lib/clubs/search";
import type { Club } from "@/lib/clubs/types";

function club(partial: Partial<Club> & { id: string; name: string; category: string }): Club {
  return {
    description: "",
    descriptionSource: "general",
    advisor: null,
    studentLeaders: [],
    meetingDays: [],
    meetingTime: null,
    meetingFrequency: null,
    location: null,
    grades: ["9", "10", "11", "12"],
    membershipRequirements: null,
    contactEmail: null,
    joinInstructions: null,
    website: null,
    registrationUrl: null,
    additionalNotes: null,
    sourceUrl: "https://eagles.edenpr.org/clubs",
    active: true,
    ...partial,
  };
}

const CLUBS: Club[] = [
  club({ id: "robotics", name: "Robotics (Team 2502)", category: "STEM", description: "design build program competitive robots engineering", meetingDays: ["Tuesday"] }),
  club({ id: "deca", name: "DECA", category: "Business", description: "marketing finance management competitive business" }),
  club({ id: "bpa", name: "Business Professionals of America", category: "Business", description: "business IT office skills" }),
  club({ id: "science-olympiad", name: "Science Olympiad", category: "STEM", description: "biology chemistry physics engineering competition", meetingDays: ["Tuesday"] }),
  club({ id: "chess", name: "Chess Club", category: "Academic", description: "strategy board game", meetingDays: ["Tuesday"] }),
  club({ id: "art", name: "Art Club", category: "Arts", description: "visual art drawing painting creative", meetingDays: ["Tuesday"] }),
  club({ id: "key", name: "Key Club", category: "Service", description: "community service volunteering leadership" }),
  club({ id: "inactive", name: "Old Club", category: "Interest", description: "disbanded", active: false }),
];

describe("searchClubs", () => {
  it("excludes inactive clubs by default", () => {
    const all = searchClubs(CLUBS, {});
    expect(all.some((c) => c.id === "inactive")).toBe(false);
    expect(searchClubs(CLUBS, { includeInactive: true }).some((c) => c.id === "inactive")).toBe(true);
  });

  it("finds robotics from the fuzzy phrase 'robot club'", () => {
    const r = searchClubs(CLUBS, { q: "robot club" });
    expect(r[0]?.id).toBe("robotics");
  });

  it("finds business clubs despite the misspelling 'buisness'", () => {
    const r = searchClubs(CLUBS, { q: "buisness" });
    const ids = r.map((c) => c.id);
    expect(ids).toContain("deca");
    expect(ids).toContain("bpa");
  });

  it("maps 'coding' to STEM/robotics via synonyms", () => {
    const r = searchClubs(CLUBS, { q: "coding" });
    expect(r.map((c) => c.id)).toContain("robotics");
  });

  it("relates 'something about medicine' to science clubs", () => {
    const r = searchClubs(CLUBS, { q: "something related to medicine" });
    expect(r.map((c) => c.id)).toContain("science-olympiad");
  });

  it("returns Tuesday clubs for a 'meets tuesday' query", () => {
    const r = searchClubs(CLUBS, { q: "clubs that meet tuesday" });
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((c) => c.meetingDays.includes("Tuesday"))).toBe(true);
    expect(r.some((c) => c.id === "deca")).toBe(false); // DECA has no listed day
  });

  it("filters by category and meeting day", () => {
    expect(searchClubs(CLUBS, { category: "Business" }).map((c) => c.id).sort()).toEqual(["bpa", "deca"]);
    expect(searchClubs(CLUBS, { meetingDay: "Tuesday" }).every((c) => c.meetingDays.includes("Tuesday"))).toBe(true);
  });

  it("sorts by name and category on request", () => {
    const byName = searchClubs(CLUBS, { sort: "name" });
    const names = byName.map((c) => c.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it("returns nothing for an unrelated query", () => {
    expect(searchClubs(CLUBS, { q: "underwater basket weaving zzzzz" })).toHaveLength(0);
  });
});

describe("meetingDaysOf", () => {
  it("lists distinct meeting days in weekday order", () => {
    expect(meetingDaysOf(CLUBS)).toEqual(["Tuesday"]);
  });
});
