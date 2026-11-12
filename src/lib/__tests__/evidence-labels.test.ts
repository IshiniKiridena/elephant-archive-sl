import { describe, expect, it } from "vitest";
import { SOURCE_TYPES, VERIFICATION_STATUSES, sourceTypeOptions, verificationOptions } from "../evidence-labels";
import { en } from "../../i18n/messages/en";
import { si } from "../../i18n/messages/si";

describe("evidence label options", () => {
  it("cover every source type once, in order", () => {
    expect(sourceTypeOptions().map((o) => o.value)).toEqual([...SOURCE_TYPES]);
  });
  it("cover every verification status once, in order", () => {
    expect(verificationOptions().map((o) => o.value)).toEqual([...VERIFICATION_STATUSES]);
  });
  it("admin options use the same English words as the public chips", () => {
    for (const o of sourceTypeOptions()) expect(o.label).toBe(en.evidence.sourceType[o.value]);
    for (const o of verificationOptions()) expect(o.label).toBe(en.evidence.verification[o.value]);
  });
  it("source type 'unverified' reads differently from verification 'unverified'", () => {
    expect(en.evidence.sourceType.unverified).not.toBe(en.evidence.verification.unverified);
  });
  it("can be built in another language", () => {
    expect(sourceTypeOptions(si).find((o) => o.value === "news")?.label).toBe(si.evidence.sourceType.news);
  });
});
