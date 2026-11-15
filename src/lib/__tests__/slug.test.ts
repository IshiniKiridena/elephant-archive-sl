import { describe, expect, it } from "vitest";
import { SLUG_MAX, SLUG_PATTERN, slugify, uniqueSlug } from "../slug";

describe("slugify", () => {
  it("makes lowercase ASCII words joined by hyphens", () => {
    expect(slugify("Example Report: Herd Count (2024)!")).toBe("example-report-herd-count-2024");
    expect(slugify("Café Déjà Vu")).toBe("cafe-deja-vu");
  });
  it("uses the fallback for Sinhala and Tamil titles instead of transliterating", () => {
    expect(slugify("උදාහරණ මාතෘකාව", "source")).toBe("source");
    expect(slugify("உதாரணத் தலைப்பு", "source")).toBe("source");
    expect(slugify("", "source")).toBe("source");
  });
  it("keeps Latin parts of a mixed title", () => expect(slugify("Example 2024 උදාහරණ", "source")).toBe("example-2024"));
  it("stays within the length limit and the pattern", () => {
    const s = slugify("word ".repeat(40));
    expect(s.length).toBeLessThanOrEqual(SLUG_MAX);
    expect(s).toMatch(SLUG_PATTERN);
  });
});

describe("uniqueSlug", () => {
  it("adds -2, -3… when taken", async () => {
    const taken = new Set(["example", "example-2"]);
    expect(await uniqueSlug("example", async (s) => taken.has(s))).toBe("example-3");
    expect(await uniqueSlug("fresh", async (s) => taken.has(s))).toBe("fresh");
  });
});
