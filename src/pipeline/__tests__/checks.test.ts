import { describe, expect, it } from "vitest";
import { runRules } from "../rules";
import { checkGrounding, csvToRecords } from "../text";
import { mergeDualRead } from "../dualread";
import { suggestVerification } from "../labels";
import type { ProposedRecord } from "../types";

// Rule-by-rule tests for runRules live in rules.test.ts.

const ctx = { now: new Date("2026-11-03"), embargoDays: 180, lawyerApproved: false };
const src = [{ url: "https://example.org/a", publisher: "Outlet A", sourceType: "news" as const }];

const death = (over: Partial<ProposedRecord> = {}): ProposedRecord => ({
  localKey: "r1", target: "elephantDeath", summary: "Adult male died after a train collision",
  fields: { date: { value: "2025-03-10", evidence: "on March 10" }, district: { value: "Polonnaruwa", evidence: "Polonnaruwa district" }, cause: { value: "train_collision", evidence: "struck by a train" } },
  sources: src, links: [], mentionsPrivatePersons: false, inputLanguage: "en", ...over,
});
const living: ProposedRecord = { localKey: "r2", target: "lifeEvent", summary: "Treated for an injury",
  fields: { kind: { value: "treatment", evidence: "x" }, date: { value: "2026-10-01", evidence: "x" }, district: { value: "Ampara", evidence: "x" } },
  sources: src, links: [], mentionsPrivatePersons: false, inputLanguage: "en" };
const blocks = (r: ProposedRecord) => runRules(r, ctx).filter((f) => f.severity === "block");
const invented = () => death({ fields: { ...death().fields, cause: { value: "gunshot", evidence: "was shot twice" } } });

describe("grounding", () => {
  const material = "The elephant was struck by a train on March 10 in Polonnaruwa district, officials said.";
  it("grounded fields pass", () => expect(checkGrounding(death(), material, false)).toHaveLength(0));
  it("invented evidence blocks", () => expect(checkGrounding(invented(), material, false).some((f) => f.severity === "block")).toBe(true));
  it("invented evidence only warns when screenshots present", () =>
    expect(checkGrounding(invented(), material, true).every((f) => f.severity === "warn")).toBe(true));
});

describe("dual read", () => {
  it("flags disagreement", () => {
    const b = [death({ fields: { ...death().fields, cause: { value: "electrocution", evidence: "x" } } })];
    expect(mergeDualRead([death()], b)[0].findings.some((f) => /disagree/.test(f.message))).toBe(true);
  });
  it("keeps a B-only record with a warning", () => {
    const merged = mergeDualRead([death()], [living]);
    expect(merged).toHaveLength(2);
    expect(merged[1].findings[0].message).toContain("Only read B");
  });
});

describe("suggested verification label", () => {
  it("one outlet → single_source", () => expect(suggestVerification(src, false)).toBe("single_source"));
  it("two outlets → multiple_outlets", () =>
    expect(suggestVerification([...src, { url: "https://other.lk/x", publisher: "Outlet B", sourceType: "news" }], false)).toBe("multiple_outlets"));
  it("social only → unverified", () => expect(suggestVerification([{ url: "https://facebook.com/x", sourceType: "social_media" }], false)).toBe("unverified"));
  it("disputed wins", () => expect(suggestVerification(src, true)).toBe("disputed"));
});

describe("CSV offline", () => {
  const rows = csvToRecords("summary,date,district,cause,source_url,source_type\nTest,2024-02-01,Anuradhapura,electrocution,https://example.org/r,official\n", "elephantDeath");
  it("csv row → record", () => {
    expect(rows).toHaveLength(1);
    expect(rows[0].fields.district.value).toBe("Anuradhapura");
    expect(rows[0].sources[0].sourceType).toBe("official");
  });
  it("csv record passes rules", () => expect(blocks(rows[0])).toHaveLength(0));
});
