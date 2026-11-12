import { describe, expect, it } from "vitest";
import { LOCALES, localeHref } from "../config";
import { getMessages } from "../get-messages";
import { en } from "../messages/en";
import { si } from "../messages/si";
import { ta } from "../messages/ta";

// TypeScript already rejects a missing or extra key in si.ts / ta.ts; this is the runtime backstop.
const leaves = (o: object, prefix = ""): [string, unknown][] =>
  Object.entries(o).flatMap(([k, v]) =>
    v && typeof v === "object" ? leaves(v, `${prefix}${k}.`) : [[`${prefix}${k}`, v] as [string, unknown]],
  );
const keys = (o: object) => leaves(o).map(([k]) => k).sort();

describe("message files", () => {
  it.each([["si", si], ["ta", ta]])("%s has exactly the English keys", (_, m) => {
    expect(keys(m)).toEqual(keys(en));
  });
  it.each([["en", en], ["si", si], ["ta", ta]])("%s has no empty strings", (_, m) => {
    const empty = leaves(m).filter(([, v]) => typeof v !== "string" || v.trim() === "").map(([k]) => k);
    expect(empty).toEqual([]);
  });
});

describe("getMessages", () => {
  it("returns each locale's own file", () => {
    expect(getMessages("en")).toBe(en);
    expect(getMessages("si")).toBe(si);
    expect(getMessages("ta")).toBe(ta);
  });
  it("covers every locale", () => {
    for (const l of LOCALES) expect(getMessages(l).translation.shownInEnglish).toBeTruthy();
  });
});

describe("localeHref", () => {
  it("keeps the path and swaps the locale", () => {
    expect(localeHref("en")).toBe("/en");
    expect(localeHref("en", "/guide/example")).toBe("/en/guide/example");
    expect(localeHref("si", "guide/example")).toBe("/si/guide/example");
  });
});
