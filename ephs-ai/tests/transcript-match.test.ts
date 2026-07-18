import { describe, expect, it } from "vitest";
import {
  matchTranscriptCourse,
  nameSimilarity,
  normalizeForMatch,
  type CatalogIndexEntry,
  type MatchContext,
} from "@/lib/domain/transcript-match";

function entry(id: string, titles: string[], ap = false, honors = false): CatalogIndexEntry {
  return { id, title: titles[0]!, normalizedTitles: titles.map(normalizeForMatch), ap, honors };
}

const entries: CatalogIndexEntry[] = [
  entry("english-9-a-and-b", ["English 9 A & B", "English 9"]),
  entry("algebra-ii", ["Algebra II", "Algebra 2"]),
  entry("honors-biology-a-and-b", ["Honors Biology A & B", "Honors Biology"], false, true),
  entry("biology-a-and-b", ["Biology A & B", "Biology"]),
  entry("ap-us-history", ["AP US History", "AP U.S. History"], true, false),
  entry("us-history", ["US History", "U.S. History"]),
];

const ctx: MatchContext = { entries };

describe("normalizeForMatch", () => {
  it("strips AP/adornments and punctuation", () => {
    expect(normalizeForMatch("AP U.S. History")).toBe("u s history");
    expect(normalizeForMatch("English 9 A & B")).toBe("english 9");
  });
});

describe("nameSimilarity", () => {
  it("scores identical normalized names as 1", () => {
    expect(nameSimilarity("algebra 2", "algebra 2")).toBe(1);
  });
  it("treats roman and arabic levels equally", () => {
    expect(nameSimilarity(normalizeForMatch("Algebra II"), normalizeForMatch("Algebra 2"))).toBe(1);
  });
});

describe("matchTranscriptCourse", () => {
  it("matches an exact title with high confidence", () => {
    const r = matchTranscriptCourse({ name: "English 9" }, ctx);
    expect(r.courseId).toBe("english-9-a-and-b");
    expect(r.confidence).toBe("high");
  });

  it("matches a semester/full-year variant", () => {
    const r = matchTranscriptCourse({ name: "English 9 A & B" }, ctx);
    expect(r.courseId).toBe("english-9-a-and-b");
    expect(r.confidence).toBe("high");
  });

  it("disambiguates Honors vs non-Honors using flags", () => {
    // Both Biology entries normalize similarly; the honors flag should pick Honors.
    const r = matchTranscriptCourse({ name: "Honors Biology", isHonors: true }, ctx);
    expect(r.courseId).toBe("honors-biology-a-and-b");
    expect(["high", "possible"]).toContain(r.confidence);
  });

  it("uses an admin equivalency as the highest authority", () => {
    const withEquiv: MatchContext = {
      entries,
      equivalencies: new Map([[normalizeForMatch("Intro to Algebra 2"), { courseId: "algebra-ii", isTransfer: false }]]),
    };
    const r = matchTranscriptCourse({ name: "Intro to Algebra 2" }, withEquiv);
    expect(r.courseId).toBe("algebra-ii");
    expect(r.method).toBe("equivalency");
    expect(r.confidence).toBe("high");
  });

  it("keeps a transfer with no match identifiable rather than forcing one", () => {
    const r = matchTranscriptCourse({ name: "Underwater Basket Weaving", isTransfer: true }, ctx);
    expect(r.courseId).toBeNull();
    expect(r.confidence).toBe("none");
    expect(r.method).toBe("transfer_unmatched");
  });

  it("does not force a weakly-related name to a high-confidence match", () => {
    const r = matchTranscriptCourse({ name: "History of the United States" }, ctx);
    // The key invariant: a loosely related name is never silently settled as 'high'.
    expect(r.confidence).not.toBe("high");
  });

  it("returns none for empty input", () => {
    expect(matchTranscriptCourse({ name: "" }, ctx).confidence).toBe("none");
  });
});
