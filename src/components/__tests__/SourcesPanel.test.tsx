import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LOCALES, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";
import type { Source } from "@/payload-types";
import {
  SourcesPanel,
  formatLooseDate,
  hasConflictingFigures,
  isShortQuote,
  safeHref,
  type PanelSource,
  type SourceCitation,
} from "../SourcesPanel";

// All fixtures are fake.
const text = (s: string) => s.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;");
const words = (n: number) => Array.from({ length: n }, (_, i) => `w${i + 1}`).join(" ");

const src = (over: Partial<PanelSource> = {}): PanelSource => ({
  id: 1,
  title: "[Example article title]",
  publisher: "Example News",
  date: "2024-03-10",
  url: "https://example.org/a",
  archiveUrl: "https://archive.example.org/a",
  language: "en",
  sourceType: "news",
  verificationStatus: "single_source",
  linkStatus: "live",
  ...over,
});
const render = (citations: SourceCitation[], locale: Locale = "en") =>
  renderToStaticMarkup(<SourcesPanel locale={locale} citations={citations} />);

describe("SourcesPanel", () => {
  it("renders nothing without sources", () => expect(render([])).toBe(""));

  it.each(LOCALES)("in %s: title, publisher, date, labels and translated links", (locale) => {
    const t = getMessages(locale);
    const html = render([{ source: src() }], locale);
    expect(html).toContain(text(t.sources.heading));
    expect(html).toContain("[Example article title]");
    expect(html).toContain("Example News");
    expect(html).toContain('<time dateTime="2024-03-10">');
    expect(html).toContain(text(t.evidence.sourceType.news));
    expect(html).toContain(text(t.evidence.verification.single_source));
    expect(html).toContain(text(t.sources.openOriginal));
    expect(html).toContain(text(t.sources.openArchived));
    expect(html).toContain(`<span class="sr-only"> ${text(t.sources.offSite)}</span>`);
    expect(html).toContain(`lang="${locale}"`);
  });

  it("marks every link as external and keeps the source's own language on its title", () => {
    const html = render([{ source: src({ language: "ta" }) }]);
    expect(html.match(/rel="external noopener noreferrer"/g)).toHaveLength(2);
    expect(html).toContain('<p lang="ta" class="font-semibold');
    expect(html).toContain('hrefLang="ta"');
  });

  describe("conflicting figures", () => {
    const a: SourceCitation = { source: src({ id: 1, publisher: "Example News", date: "2024-03-10" }), figure: { value: "[Figure A]", counts: "[What it counts]" } };
    const b: SourceCitation = { source: src({ id: 2, publisher: "Example Department", date: "2023" }), figure: { value: "[Figure B]", counts: "[What it counts]" } };

    it("shows every figure side by side with its date, in the order given", () => {
      const html = render([a, b]);
      expect(html).toContain(text(getMessages("en").sources.conflictHeading));
      const iA = html.indexOf("[Figure A]");
      const iB = html.indexOf("[Figure B]");
      expect(iA).toBeGreaterThan(-1);
      expect(iB).toBeGreaterThan(iA);
      expect(html).toContain("10 March 2024");
      expect(html).toContain('<time dateTime="2023">2023</time>');
    });

    it("never picks one: reversing the sources reverses the order and nothing else", () => {
      const html = render([b, a]);
      expect(html.indexOf("[Figure B]")).toBeLessThan(html.indexOf("[Figure A]"));
      expect(html.match(/text-3xl font-extrabold/g)).toHaveLength(2);
    });

    it("no comparison when the figures agree; the figure stays on each source", () => {
      const html = render([a, { ...b, figure: { value: "[Figure A]" } }]);
      expect(html).not.toContain(text(getMessages("en").sources.conflictHeading));
      expect(html.match(/\[Figure A\]/g)).toHaveLength(2);
    });

    it("detects conflicts by stored value", () => {
      expect(hasConflictingFigures([a, b])).toBe(true);
      expect(hasConflictingFigures([a, a])).toBe(false);
      expect(hasConflictingFigures([a, { source: src() }])).toBe(false);
    });
  });

  describe("quotes (rule 7)", () => {
    it("shows a quote under 15 words", () => {
      expect(render([{ source: src(), quote: words(14) }])).toContain(`<q lang="en">${words(14)}</q>`);
    });
    it("drops a quote of 15 words or more entirely, never trimmed", () => {
      const html = render([{ source: src(), quote: words(15) }]);
      expect(html).not.toContain("<q");
      expect(html).not.toContain("w1 ");
    });
    it("counts words", () => {
      expect(isShortQuote(words(14))).toBe(true);
      expect(isShortQuote(words(15))).toBe(false);
      expect(isShortQuote("   ")).toBe(false);
      expect(isShortQuote(null)).toBe(false);
    });
  });

  it("never renders internal notes or any field outside PanelSource", () => {
    const full = { ...src(), notes: "INTERNAL NOTE", accessedAt: "2024-04-01", createdAt: "x", updatedAt: "y" } as Source;
    expect(render([{ source: full }])).not.toContain("INTERNAL NOTE");
  });

  describe("link states", () => {
    const t = getMessages("en").sources;
    it("removed: archived copy only, with the archive sentence", () => {
      const html = render([{ source: src({ linkStatus: "removed" }) }]);
      expect(html).not.toContain(t.openOriginal);
      expect(html).toContain(t.openArchived);
      expect(html).toContain(t.linkStatus.removed);
      expect(html).toContain(t.archiveKept);
    });
    it("removed without an archived copy: no links, and no claim that a copy exists", () => {
      const html = render([{ source: src({ linkStatus: "removed", archiveUrl: null }) }]);
      expect(html).not.toContain("<a ");
      expect(html).not.toContain(t.archiveKept);
    });
    it("unreachable without an archived copy keeps the original link", () => {
      expect(render([{ source: src({ linkStatus: "unreachable", archiveUrl: null }) }])).toContain(t.openOriginal);
    });
    it("corrected keeps both links", () => {
      const html = render([{ source: src({ linkStatus: "corrected" }) }]);
      expect(html).toContain(t.openOriginal);
      expect(html).toContain(t.openArchived);
      expect(html).toContain(t.linkStatus.corrected);
    });
    it("offline sources say so and have no links", () => {
      const html = render([{ source: src({ url: null, archiveUrl: null, linkStatus: null }) }]);
      expect(html).toContain(t.offline);
      expect(html).not.toContain("<a ");
    });
    it("only http(s) links are rendered", () => {
      expect(safeHref("javascript:alert(1)")).toBeNull();
      expect(safeHref("https://example.org/x")).toBe("https://example.org/x");
      expect(render([{ source: src({ archiveUrl: "javascript:alert(1)" }) }])).not.toContain("javascript:");
    });
  });

  describe("dates are never more precise than the source", () => {
    it.each([
      ["2024", "en", "2024"],
      ["2024-03", "en", "March 2024"],
      ["2024-03-10", "en", "10 March 2024"],
    ] as const)("%s in %s → %s", (d, l, out) => expect(formatLooseDate(d, l)).toBe(out));
    it("a year-only date has no month or day in any locale", () => {
      for (const l of LOCALES) expect(formatLooseDate("2024", l)).toBe("2024");
    });
    it("ignores malformed dates", () => {
      expect(formatLooseDate("10/03/2024", "en")).toBeNull();
      expect(formatLooseDate(null, "en")).toBeNull();
    });
  });

  it("uses token classes only, no raw hex or inline style", () => {
    const file = readFileSync(fileURLToPath(new URL("../SourcesPanel.tsx", import.meta.url)), "utf8");
    expect(file).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(file).not.toMatch(/style=/);
  });
});
