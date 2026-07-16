import { describe, expect, it } from "vitest";
import { parsePrerequisite } from "@/lib/domain/prerequisites";
import { makeResolver } from "./helpers";

const resolve = makeResolver({
  "Ceramics I": "ceramics-i",
  "Ceramics II": "ceramics-ii",
  "Chemistry A & B": "chemistry",
  "Honors Chemistry A & B": "honors-chemistry",
  "Earth & Space Science": "earth-space",
  Geometry: "geometry",
  "Marketing Strategies": "marketing-strategies",
});

const ctx = { resolveCourseName: resolve };

describe("parsePrerequisite", () => {
  it("treats empty and 'None' as no prerequisite", () => {
    expect(parsePrerequisite(null, ctx).kind).toBe("none");
    expect(parsePrerequisite("", ctx).kind).toBe("none");
    expect(parsePrerequisite("None", ctx).kind).toBe("none");
  });

  it("resolves a single course name", () => {
    const p = parsePrerequisite("Ceramics I", ctx);
    expect(p).toEqual({ kind: "courses", raw: "Ceramics I", groups: [["ceramics-i"]] });
  });

  it("handles simple OR phrasing as one group with options", () => {
    const p = parsePrerequisite("Chemistry A & B or Honors Chemistry A & B", ctx);
    expect(p.kind).toBe("courses");
    if (p.kind === "courses") {
      expect(p.groups).toEqual([["chemistry", "honors-chemistry"]]);
    }
  });

  it("handles simple AND phrasing as multiple groups", () => {
    const p = parsePrerequisite("Earth & Space Science and Geometry", ctx);
    expect(p.kind).toBe("courses");
    if (p.kind === "courses") {
      expect(p.groups).toEqual([["earth-space"], ["geometry"]]);
    }
  });

  it("does not split official titles containing '&'", () => {
    const p = parsePrerequisite("Earth & Space Science", ctx);
    expect(p.kind).toBe("courses");
  });

  it("flags teacher recommendation as manual", () => {
    const p = parsePrerequisite("Ceramics I or teacher recommendation", ctx);
    expect(p.kind).toBe("manual");
  });

  it("flags applications, auditions, GPA and concurrent enrollment as manual", () => {
    for (const raw of [
      "Application",
      "Audition in Spring",
      "a grade of “C” or better is recommended",
      "Must be concurrently enrolled in a 9th Grade Music course",
      "Meets EPHS AVID Steps to Success eligibility criteria with completed AVID application and interview",
    ]) {
      expect(parsePrerequisite(raw, ctx).kind, raw).toBe("manual");
    }
  });

  it("returns unknown for unmatched course names instead of guessing", () => {
    const p = parsePrerequisite("Two Ceramics Courses", ctx);
    expect(p.kind).toBe("unknown");
  });

  it("returns unknown when any AND segment is unresolvable", () => {
    const p = parsePrerequisite("Ceramics I and Something Unlisted", ctx);
    expect(p.kind).toBe("unknown");
  });
});
