import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LOCALES } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";
import { LEGAL_NOTICE_VARIANTS, LegalNotice } from "../LegalNotice";

const text = (s: string) => s.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;");
const source = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

describe("LegalNotice", () => {
  describe.each(LOCALES)("in %s", (locale) => {
    const t = getMessages(locale).legalNotice;

    it.each(["deaths", "court"] as const)("%s: a labelled note with the full text in the page language", (variant) => {
      const html = renderToStaticMarkup(<LegalNotice locale={locale} variant={variant} />);
      expect(html).toContain('role="note"');
      expect(html).toContain(`aria-label="${text(t.label)}"`);
      expect(html).toContain(`lang="${locale}"`);
      expect(html).toContain(text(t[variant]));
    });

    it("short: plain footer text, no box or icon", () => {
      const html = renderToStaticMarkup(<LegalNotice locale={locale} variant="short" />);
      expect(html).toBe(`<p lang="${locale}" class="text-[0.8125rem] break-words text-muted">${text(t.short)}</p>`);
    });
  });

  // The approved English wording. Changing it should be a deliberate, lawyer-reviewed edit.
  it("English wording is exactly as approved for drafting", () => {
    const t = getMessages("en").legalNotice;
    expect(t.deaths).toBe(
      "This record spreads knowledge. It describes deaths as the listed sources report them, and is not an accusation against any person or community, or legal advice. Places are shown by district only.",
    );
    expect(t.court).toBe(
      "This archive shares information for public knowledge. It is not an accusation or legal advice. People named in cases are presumed innocent unless a court has convicted them.",
    );
    expect(t.short).toBe("For public knowledge, not accusation or legal advice.");
  });

  it("every legal line carries its review TODOs until a lawyer (and native speaker) signs off", () => {
    const block = (file: string) => source(file).match(/legalNotice: \{([\s\S]*?)\n {2}\},/)![1];
    for (const [file, tags] of [
      ["../../i18n/messages/en.ts", ["TODO(lawyer-review)"]],
      ["../../i18n/messages/si.ts", ["TODO(si-review)", "TODO(lawyer-review)"]],
      ["../../i18n/messages/ta.ts", ["TODO(ta-review)", "TODO(lawyer-review)"]],
    ] as const) {
      const b = block(file);
      for (const v of LEGAL_NOTICE_VARIANTS) {
        // key, the string (possibly on the next line), then the trailing comment on the string's line
        const line = b.match(new RegExp(`${v}:\\s*"[^"]*",[^\\n]*`))![0];
        for (const tag of tags) expect(line, `${file} ${v}`).toContain(tag);
      }
    }
  });

  it("Quiet zone: token classes only, no motion, no warning or alarm icons", () => {
    const code = source("../LegalNotice.tsx").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    expect(code).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(code).not.toMatch(/style=/);
    expect(code).not.toMatch(/\b(animate-|transition|transform|translate-|scale-|rotate-|duration-)/);
    // warning triangle / exclamation / bell paths
    expect(code).not.toMatch(/M12 8v5|M10\.3 3\.9|M12 16h\.01|M18 8a6 6 0 0 0-12 0/);
  });
});
