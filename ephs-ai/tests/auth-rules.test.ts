import { describe, expect, it } from "vitest";
import {
  decideAccess,
  deriveRole,
  emailDomain,
  isAdminEmail,
  isStudentEmail,
  normalizeEmail,
  parseAdminAllowlist,
  type RoleRules,
} from "@/lib/auth/rules";

const rules: RoleRules = {
  studentDomain: "ep-student.org",
  adminDomain: "edenpr.k12.mn.us",
  adminEmails: ["sahil.parasharami@gmail.com"],
};

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  Student@EP-Student.org ")).toBe("student@ep-student.org");
  });
  it("handles nullish", () => {
    expect(normalizeEmail(undefined)).toBe("");
    expect(normalizeEmail(null)).toBe("");
  });
});

describe("emailDomain", () => {
  it("extracts the domain", () => {
    expect(emailDomain("a@ep-student.org")).toBe("ep-student.org");
  });
  it("rejects malformed addresses", () => {
    expect(emailDomain("no-at-sign")).toBeNull();
    expect(emailDomain("a@@b")).toBeNull();
    expect(emailDomain("@ep-student.org")).toBeNull();
    expect(emailDomain("a@")).toBeNull();
  });
});

describe("parseAdminAllowlist", () => {
  it("splits, normalizes and dedupes", () => {
    expect(parseAdminAllowlist("A@x.com, b@y.com;A@x.com  c@z.com")).toEqual([
      "a@x.com",
      "b@y.com",
      "c@z.com",
    ]);
  });
  it("returns empty for blank", () => {
    expect(parseAdminAllowlist("")).toEqual([]);
    expect(parseAdminAllowlist(undefined)).toEqual([]);
  });
});

describe("isStudentEmail", () => {
  it("accepts the exact student domain (case-insensitive)", () => {
    expect(isStudentEmail("Jane.Doe@ep-student.org", rules)).toBe(true);
  });
  it("rejects personal gmail and lookalike domains", () => {
    expect(isStudentEmail("jane@gmail.com", rules)).toBe(false);
    expect(isStudentEmail("jane@sub.ep-student.org", rules)).toBe(false);
    expect(isStudentEmail("jane@ep-student.org.evil.com", rules)).toBe(false);
    expect(isStudentEmail("jane@notep-student.org", rules)).toBe(false);
  });
});

describe("isAdminEmail", () => {
  it("accepts the district domain", () => {
    expect(isAdminEmail("staff@edenpr.k12.mn.us", rules)).toBe(true);
  });
  it("accepts the explicit allowlisted exception only", () => {
    expect(isAdminEmail("sahil.parasharami@gmail.com", rules)).toBe(true);
    expect(isAdminEmail("someone.else@gmail.com", rules)).toBe(false);
  });
  it("does not weaken the gmail domain in general", () => {
    expect(isAdminEmail("random@gmail.com", rules)).toBe(false);
  });
});

describe("deriveRole", () => {
  it("derives admin for district + allowlist", () => {
    expect(deriveRole("t@edenpr.k12.mn.us", rules)).toBe("admin");
    expect(deriveRole("SAHIL.parasharami@gmail.com", rules)).toBe("admin");
  });
  it("derives student for the student domain", () => {
    expect(deriveRole("kid@ep-student.org", rules)).toBe("student");
  });
  it("denies everyone else", () => {
    expect(deriveRole("nobody@gmail.com", rules)).toBeNull();
    expect(deriveRole("teacher@otherdistrict.org", rules)).toBeNull();
  });
});

describe("decideAccess", () => {
  it("grants the derived role regardless of which portal was chosen", () => {
    // Admin email selecting the STUDENT portal is still an admin, never denied
    // just for the button; a student email selecting ADMIN is a student.
    expect(decideAccess("t@edenpr.k12.mn.us", "student", rules)).toEqual({
      allowed: true,
      role: "admin",
    });
    expect(decideAccess("kid@ep-student.org", "admin", rules)).toEqual({
      allowed: true,
      role: "student",
    });
  });
  it("denies with a portal-appropriate reason", () => {
    expect(decideAccess("x@gmail.com", "admin", rules)).toEqual({
      allowed: false,
      role: null,
      reason: "not_admin",
    });
    expect(decideAccess("x@gmail.com", "student", rules)).toEqual({
      allowed: false,
      role: null,
      reason: "not_student_domain",
    });
  });
});
