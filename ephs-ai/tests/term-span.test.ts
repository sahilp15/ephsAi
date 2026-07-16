import { describe, expect, it } from "vitest";
import { interpretTermSpan } from "@/lib/domain/term-span";

describe("interpretTermSpan", () => {
  it("maps the guide's wording to term counts", () => {
    expect(interpretTermSpan("one term unless otherwise noted").terms).toBe(1);
    expect(interpretTermSpan("two terms / one semester unless otherwise noted").terms).toBe(2);
    expect(interpretTermSpan("one semester (two terms)").terms).toBe(2);
    expect(interpretTermSpan("three terms").terms).toBe(3);
    expect(interpretTermSpan("full year").terms).toBe(4);
  });

  it("marks repeatable term-based courses", () => {
    const span = interpretTermSpan("one term; repeatable/term-based as listed");
    expect(span.terms).toBe(1);
    expect(span.repeatable).toBe(true);
  });

  it("requires counselor verification when the source does not determine scheduling", () => {
    for (const raw of [
      null,
      "skinny format; see course notes",
      "multi-term program; see course notes",
      "something unrecognized",
    ]) {
      const span = interpretTermSpan(raw);
      expect(span.terms).toBeNull();
      expect(span.requiresVerification).toBe(true);
    }
  });
});
