import { describe, expect, it, vi } from "vitest";

// The counseling-staff module is marked "server-only"; stub that marker so the
// pure assignment logic can be exercised in the node test environment.
vi.mock("server-only", () => ({}));

import {
  findAssignment,
  lastNameFromDisplayName,
  STUDENT_CENTERS,
} from "@/lib/ai/counseling-staff";

describe("lastNameFromDisplayName", () => {
  it("takes the final token of a full name", () => {
    expect(lastNameFromDisplayName("Jordan Lee")).toBe("Lee");
    expect(lastNameFromDisplayName("Maria De La Cruz")).toBe("Cruz");
  });
  it("returns a lone name unchanged and handles blanks", () => {
    expect(lastNameFromDisplayName("Jordan")).toBe("Jordan");
    expect(lastNameFromDisplayName("   ")).toBe("");
  });
});

describe("findAssignment", () => {
  it("routes A-G last names to Student Center 1", () => {
    const t = findAssignment("Anderson");
    expect(t?.counselor.name).toBe("Anthea Amsler");
    expect(t?.center).toBe(1);
    expect(t?.dean.name).toBe("Sally Ratemo");
  });

  it("keeps the end of a range inclusive (Johnson -> H-Joh)", () => {
    const t = findAssignment("Johnson");
    expect(t?.counselor.name).toBe("Lenny Moskowitz");
    expect(t?.center).toBe(2);
  });

  it("routes just past a boundary to the next counselor (Jones -> Joi-Mari)", () => {
    const t = findAssignment("Jones");
    expect(t?.counselor.name).toBe("Jadyn Biermaier");
  });

  it("routes H-N last names to Student Center 2", () => {
    const t = findAssignment("Nguyen");
    expect(t?.counselor.name).toBe("Amy Harnack");
    expect(t?.center).toBe(2);
    expect(t?.dean.name).toBe("Justin Timm");
  });

  it("routes O-Z last names to Student Center 3", () => {
    const olson = findAssignment("Olson");
    expect(olson?.counselor.name).toBe("Jennifer Hanson");
    expect(olson?.center).toBe(3);
    expect(olson?.dean.name).toBe("Nate Beulah");

    expect(findAssignment("Smith")?.counselor.name).toBe("Lisa Quiring");
    expect(findAssignment("Zimmerman")?.counselor.name).toBe("Mark Otis");
  });

  it("is case-insensitive and ignores trailing punctuation", () => {
    expect(findAssignment("o'brien")?.center).toBe(3);
    expect(findAssignment("ANDERSON")?.counselor.name).toBe("Anthea Amsler");
  });

  it("returns null for an empty last name", () => {
    expect(findAssignment("")).toBeNull();
    expect(findAssignment("   ")).toBeNull();
  });

  it("assigns every plain A-Z surname to some team", () => {
    const surnames = [
      "Adams", "Brown", "Clark", "Davis", "Evans", "Flores", "Garcia",
      "Harris", "Ibrahim", "Jackson", "Kim", "Lopez", "Martin", "Nelson",
      "Owens", "Patel", "Quinn", "Reed", "Sanchez", "Thomas", "Underwood",
      "Vang", "White", "Xiong", "Young", "Zhang",
    ];
    for (const s of surnames) {
      expect(findAssignment(s), `${s} should resolve`).not.toBeNull();
    }
  });

  it("exposes exactly three student centers", () => {
    expect(STUDENT_CENTERS.map((c) => c.center)).toEqual([1, 2, 3]);
  });
});
