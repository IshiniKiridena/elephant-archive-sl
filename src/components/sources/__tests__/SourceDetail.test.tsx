import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LOCALES } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";
import type { CitingRecord, PublicSource } from "@/lib/sources/get-source";
import { SourceDetail, citationText } from "../SourceDetail";

// All fixtures are fake: example.org links and bracketed placeholders.
const src = (over: Partial<PublicSource> = {}): PublicSource => ({
  id: 1,
  title: "[Example article title]",
  slug: "example-article",
  publisher: "Example News",
  date: "2024-03-10",
  url: "https://example.org/example-article",
  archiveUrl: "https://archive.example.org/example-article",
  language: "en",
  sourceType: "news",
  verificationStatus: "single_source",
  linkStatus: "live",
  accessedAt: "2026-03-03T00:00:00.000Z",
  _status: "published",
  ...over,
});
const render = (s: PublicSource, locale: (typeof LOCALES)[number] = "en", records: CitingRecord[] = []) =>
  renderToStaticMarkup(<SourceDetail source={s} locale={locale} records={records} />);
const esc = (s: string) => s.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;");

describe("SourceDetail", () => {
  it.each(LOCALES)("shows both labels as words in %s", (locale) => {
    const html = render(src(), locale);
    const e = getMessages(locale).evidence;
    expect(html).toContain(esc(e.sourceType.news));
    expect(html).toContain(esc(e.verification.single_source));
    expect(html).toContain(esc(getMessages(locale).sourcePage.sourceTypeText.news));
  });

  it("marks the title with the source's own language, not the page's", () => {
    expect(render(src({ language: "si", title: "[Example Sinhala-language title]" }), "en")).toMatch(/<h1 id="source-title" lang="si"/);
  });

  it("leads with the original when the page is live", () => {
    const html = render(src());
    expect(html).toContain('href="https://example.org/example-article"');
    expect(html).toMatch(/class="btn-primary[^"]*"[^>]*>Open the original/);
  });

  it.each(["removed", "unreachable"] as const)("when %s, leads with the archived copy and drops the original link", (linkStatus) => {
    const html = render(src({ linkStatus }));
    expect(html).not.toContain('href="https://example.org/example-article"');
    expect(html).toMatch(/class="btn-primary[^"]*"[^>]*>Open the archived copy/);
    expect(html).toContain(esc(getMessages("en").sources.archiveKept));
  });

  it("never links unsafe URLs", () => {
    const html = render(src({ url: "javascript:alert(1)", archiveUrl: "data:text/html,x" }));
    expect(html).not.toMatch(/javascript:|data:text/);
  });

  it("renders only public fields (no internal notes)", () => {
    const withNotes = { ...src(), notes: "[internal note, must not render]" } as PublicSource;
    expect(render(withNotes)).not.toContain("internal note");
  });

  it("shows the empty state until records cite the source, and no translation note", () => {
    const html = render(src(), "si");
    expect(html).toContain(esc(getMessages("si").sourcePage.noRecords));
    expect(html).not.toContain('role="note"');
  });

  it("shows the translation note on si/ta when a citing record fell back to English", () => {
    const record: CitingRecord = {
      key: "r1",
      href: "/si/example-record",
      kind: "[Example kind]",
      title: { value: "[Example record title]", lang: "en", fellBack: true },
    };
    const html = render(src(), "si", [record]);
    expect(html).toContain('role="note"');
    expect(html).toContain(esc(getMessages("si").translation.shownInEnglish));
    expect(html).toContain('lang="en"');
  });

  it("builds the citation from what the source has", () => {
    const t = getMessages("en").sourcePage;
    expect(citationText(src(), "en", t)).toBe(
      'Example News. "[Example article title]". 10 March 2024. https://example.org/example-article. Accessed 3 March 2026.',
    );
    expect(citationText(src({ publisher: null, date: "2024", url: null, archiveUrl: null, accessedAt: null }), "en", t)).toBe(
      '"[Example article title]". 2024.',
    );
  });
});
