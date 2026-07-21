import { describe, expect, it } from "vitest";
import {
  levenshtein,
  tokenize,
  expandQuery,
  fuzzyTokenMatch,
  weekdaysIn,
  normalizeText,
} from "@/lib/search/fuzzy";

describe("levenshtein", () => {
  it("measures edit distance", () => {
    expect(levenshtein("business", "business")).toBe(0);
    expect(levenshtein("buisness", "business")).toBeLessThanOrEqual(2);
    expect(levenshtein("cat", "dog")).toBe(3);
  });
});

describe("normalizeText / tokenize", () => {
  it("lowercases, strips punctuation, drops stopwords and 'club'", () => {
    expect(normalizeText("Robotics Club!")).toBe("robotics club");
    expect(tokenize("what clubs are good for coding")).toEqual(["coding"]);
  });
});

describe("expandQuery", () => {
  it("adds related-interest synonyms at lower weight", () => {
    const terms = expandQuery("coding");
    const map = new Map(terms.map((t) => [t.term, t.weight]));
    expect(map.get("coding")).toBe(1);
    // coding expands toward computer / programming / robotics
    expect(map.has("computer")).toBe(true);
    expect(map.get("computer")).toBeLessThan(1);
  });

  it("maps common misspellings via synonyms", () => {
    const terms = expandQuery("buisness");
    expect(terms.some((t) => t.term === "business" || t.term === "deca")).toBe(true);
  });
});

describe("fuzzyTokenMatch", () => {
  const tokens = tokenize("Robotics engineering build team science");
  it("matches exact and substring tokens", () => {
    expect(fuzzyTokenMatch(tokens, "robotics")).toBe(true);
    expect(fuzzyTokenMatch(tokens, "engineer")).toBe(true);
  });
  it("tolerates typos within the edit budget", () => {
    expect(fuzzyTokenMatch(tokens, "robatics")).toBe(true); // 1 edit
    expect(fuzzyTokenMatch(tokens, "enginering")).toBe(true); // 1 edit
  });
  it("rejects unrelated words", () => {
    expect(fuzzyTokenMatch(tokens, "cooking")).toBe(false);
  });
});

describe("weekdaysIn", () => {
  it("finds weekday references in free text", () => {
    expect(weekdaysIn("clubs that meet tuesday")).toContain("tuesday");
    expect(weekdaysIn("anything on friday?")).toContain("friday");
    expect(weekdaysIn("no day here")).toHaveLength(0);
  });
});
