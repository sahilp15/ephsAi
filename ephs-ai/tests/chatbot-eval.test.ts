import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { searchClubs } from "@/lib/clubs/search";
import type { Club } from "@/lib/clubs/types";

/**
 * Validates the chatbot evaluation dataset and exercises the real club
 * retrieval (fuzzy + synonym) against the actual seed data, so misspelled and
 * indirect prompts resolve to sensible official clubs. Reads the JSON files
 * directly (not through the server-only stores) so it runs in the node test env.
 */

function readJson<T>(rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), rel), "utf8")) as T;
}

const evalSet = readJson<{
  intents: string[];
  prompts: Array<{ question: string; category: string; expectedIntent: string; expectedBehavior: string[] }>;
}>("data/chatbot-eval.json");

const clubs = readJson<{ clubs: Club[] }>("data/ephs-clubs.json").clubs.filter((c) => c.active);

describe("chatbot eval dataset", () => {
  it("has at least 75 varied prompts", () => {
    expect(evalSet.prompts.length).toBeGreaterThanOrEqual(75);
  });

  it("every prompt is well-formed", () => {
    for (const p of evalSet.prompts) {
      expect(p.question.trim().length).toBeGreaterThan(0);
      expect(p.category.trim().length).toBeGreaterThan(0);
      expect(p.expectedIntent.trim().length).toBeGreaterThan(0);
      expect(Array.isArray(p.expectedBehavior)).toBe(true);
      expect(p.expectedBehavior.length).toBeGreaterThan(0);
    }
  });

  it("covers the key categories (typos, follow-ups, combined, schedule, safety)", () => {
    const cats = evalSet.prompts.map((p) => p.category).join(" ");
    for (const needle of ["misspelling", "follow-up", "combined", "term-capacity", "open-period", "hallucination", "out-of-scope", "safety"]) {
      expect(cats).toContain(needle);
    }
  });

  it("references only declared intents", () => {
    const declared = new Set(evalSet.intents);
    for (const p of evalSet.prompts) {
      expect(declared.has(p.expectedIntent)).toBe(true);
    }
  });
});

describe("real-data retrieval for representative prompts", () => {
  it("'wut clubs r good for coding' surfaces a STEM/computer club", () => {
    const r = searchClubs(clubs, { q: "wut clubs r good for coding" });
    expect(r.length).toBeGreaterThan(0);
    expect(r.slice(0, 5).some((c) => c.category === "STEM")).toBe(true);
  });

  it("'buisness' (misspelled) finds a business club", () => {
    const r = searchClubs(clubs, { q: "buisness" });
    expect(r.some((c) => c.category === "Business")).toBe(true);
  });

  it("'something related to medicine' finds a science/health club", () => {
    const r = searchClubs(clubs, { q: "something related to medicine" });
    expect(r.some((c) => c.category === "STEM" || /health|medic|science/i.test(c.description))).toBe(true);
  });

  it("'clubs that meet tuesday' only returns Tuesday clubs", () => {
    const r = searchClubs(clubs, { q: "clubs that meet tuesday" });
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((c) => c.meetingDays.includes("Tuesday"))).toBe(true);
  });

  it("an out-of-scope query returns no club matches", () => {
    expect(searchClubs(clubs, { q: "quantum blockchain crypto mining rig" })).toHaveLength(0);
  });
});
