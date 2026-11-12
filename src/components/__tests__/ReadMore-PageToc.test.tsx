import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LOCALES } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";
import { PageToc } from "../PageToc";
import { ReadMore } from "../ReadMore";

const text = (s: string) => s.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;");
const code = (rel: string) =>
  readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
const MOTION = /\b(animate-|transition|duration-|ease-|translate-|scale-|rotate-|starting:)/;

describe("ReadMore", () => {
  it.each(LOCALES)("in %s: native details, 'Read more' when closed, 'Show less' when open", (locale) => {
    const t = getMessages(locale).readMore;
    const html = renderToStaticMarkup(<ReadMore locale={locale}>[Example hidden text]</ReadMore>);
    expect(html).toMatch(/^<details class="group"><summary lang="/);
    expect(html).toContain(`<span class="group-open:hidden">${text(t.more)}</span>`);
    expect(html).toContain(`<span class="hidden group-open:inline">${text(t.less)}</span>`);
    expect(html).toMatch(/<\/summary><div[^>]*>\[Example hidden text\]<\/div><\/details>$/);
  });

  it("has a visible 2px sage focus ring with 2px offset", () => {
    const html = renderToStaticMarkup(<ReadMore locale="en">x</ReadMore>);
    expect(html).toContain("focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage");
  });

  it("names what it expands for screen readers, in its own language", () => {
    const html = renderToStaticMarkup(
      <ReadMore locale="si" label="[Example section]" labelLang="en">
        x
      </ReadMore>,
    );
    expect(html).toContain('<span class="sr-only">: <span lang="en">[Example section]</span></span>');
  });

  it("Quiet (default): no motion classes at all, colour change only", () => {
    const html = renderToStaticMarkup(<ReadMore locale="en">x</ReadMore>);
    expect(html).not.toMatch(MOTION);
    expect(html).toContain("group-open:text-ivory");
  });

  it("Bright: opacity + translate only, ≤ 220 ms, and every motion class is motion-safe:", () => {
    const html = renderToStaticMarkup(
      <ReadMore locale="en" zone="bright">
        x
      </ReadMore>,
    );
    const motion = [...html.matchAll(/class="([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/)).filter((c) => MOTION.test(c));
    expect(motion.length).toBeGreaterThan(0);
    for (const c of motion) expect(c, c).toMatch(/^motion-safe:/);
    expect(motion).toContain("motion-safe:transition-[opacity,translate]");
    expect(motion).toContain("motion-safe:duration-200");
    expect(motion).toContain("motion-safe:ease-out");
    expect(motion).not.toContain("motion-safe:transition-all");
  });
});

describe("PageToc", () => {
  const sections = [
    { id: "example-one", title: "[Example section one]" },
    { id: "example-two", title: "[Example section two]", lang: "en" as const },
  ];

  it("renders nothing without sections", () => expect(renderToStaticMarkup(<PageToc locale="en" sections={[]} />)).toBe(""));

  it.each(LOCALES)("in %s: a labelled nav with anchor links in order", (locale) => {
    const t = getMessages(locale).toc;
    const html = renderToStaticMarkup(<PageToc locale={locale} sections={sections} />);
    expect(html).toContain(`<nav lang="${locale}" aria-label="${text(t.onThisPage)}"`);
    expect(html.indexOf('href="#example-one"')).toBeLessThan(html.indexOf('href="#example-two"'));
    expect(html).toContain('lang="en" class="flex items-center');
  });

  it("collapses into <details> below md and is a plain list from md up", () => {
    const html = renderToStaticMarkup(<PageToc locale="ta" sections={sections} />);
    expect(html).toMatch(/<details class="[^"]*\bmd:hidden\b/);
    expect(html).toMatch(/<div class="hidden [^"]*\bmd:block\b/);
    // each link appears once per copy, and CSS shows exactly one copy
    expect(html.match(/href="#example-one"/g)).toHaveLength(2);
  });

  it("encodes ids safely in the href", () => {
    const html = renderToStaticMarkup(<PageToc locale="en" sections={[{ id: 'a"b c', title: "x" }]} />);
    expect(html).toContain('href="#a%22b%20c"');
  });
});

describe("both components", () => {
  it.each(["../ReadMore.tsx", "../PageToc.tsx"])("%s: server component, tokens only, no scroll-spy JS", (file) => {
    const src = code(file);
    expect(src).not.toMatch(/["']use client["']/);
    expect(src).not.toMatch(/\buse(State|Effect|Ref|LayoutEffect)\b|IntersectionObserver|addEventListener|onScroll/);
    expect(src).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(src).not.toMatch(/style=/);
  });

  it("PageToc has no motion at all", () => {
    expect(code("../PageToc.tsx")).not.toMatch(MOTION);
  });
});
