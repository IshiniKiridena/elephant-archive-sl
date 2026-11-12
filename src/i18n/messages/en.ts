import type { SourceType, VerificationStatus } from "../../lib/evidence-labels";

/**
 * UI strings. English is the source: si.ts and ta.ts are typed as `Messages`, so a missing
 * or extra key there is a TypeScript error.
 *
 * Menus, buttons, labels and notices are always fully translated (the page frame never falls
 * back). Content from the CMS falls back per block instead: see ../fallback.ts.
 */
export const en = {
  siteName: "Elephant Archive Sri Lanka",
  tagline: "An open, labelled record of Sri Lanka's elephants",
  nav: { menu: "Menu", contribute: "Contribute", language: "Language" },
  home: {
    heroTitle: "Every elephant has a story worth knowing",
    heroBody: "Lives, losses, rescues and history, each with its source and how far it has been checked.",
    heroCta: "Explore the record",
  },
  herd: { pause: "Pause", play: "Play" },
  fact: { didYouKnow: "Did you know?", flip: "Where is this from?", back: "Back", source: "Source", share: "Share card" },
  footer: {
    legal: "This archive spreads knowledge. It is not an accusation or legal advice.",
    linksLabel: "About this archive",
  },
  evidence: {
    groupLabel: "Evidence labels",
    sourceTypePrefix: "Source type:",
    verificationPrefix: "Verification:",
    sourceType: {
      official: "Official",
      court_record: "Court record",
      academic: "Academic",
      news: "News",
      organisation: "Organisation",
      community: "Community",
      social_media: "Social media",
      unverified: "Unverified source",
    } satisfies Record<SourceType, string>,
    verification: {
      verified: "Verified",
      multiple_outlets: "Reported by multiple outlets",
      single_source: "Single source",
      disputed: "Disputed",
      unverified: "Unverified",
    } satisfies Record<VerificationStatus, string>,
  },
  sources: {
    heading: "Sources",
    published: "Published",
    offline: "Print or offline source",
    openOriginal: "Open the original",
    openArchived: "Open the archived copy",
    offSite: "(opens another website)",
    linkStatus: {
      removed: "Removed by publisher.",
      unreachable: "We could not reach this page when we last checked.",
      corrected: "The publisher has corrected this page since we first cited it.",
    },
    archiveKept: "Our archived copy is kept so the record can still be checked.",
    conflictHeading: "Sources give different figures",
    conflictBody: "We show each figure with its date. We don't choose between them.",
  },
  dataLimits: {
    heading: "Limits of this data",
    kind: { gap: "Gap in the data", unconfirmed: "Cause not confirmed", conflict: "Conflicting figures" },
    conflictNote: "Each figure is shown with its date. We don't choose between them.",
    readMore: "Read more",
    lastChecked: "Last checked",
    methodLink: "How we label evidence",
    correctionLink: "Report a missing record or correction",
  },
  header: {
    home: "Elephant Archive Sri Lanka, home",
  },
  menu: {
    close: "Close menu",
    sectionsLabel: "Sections",
    moreHeading: "More",
    sections: {
      elephants: { title: "Elephants", description: "Individual elephants and their life stories." },
      deaths: { title: "Deaths & Causes", description: "Elephant deaths by year, cause and district, with sources." },
      rescues: { title: "Rescues & Care", description: "Rescues, treatment and care, as reported." },
      courtCases: { title: "Court Cases", description: "Cases involving elephants, described as alleged until a court convicts." }, // TODO(lawyer-review)
      governmentActions: { title: "Government Actions", description: "Laws, gazettes, policies and programmes over time." },
      history: { title: "History & Culture", description: "Elephants in Sri Lanka from the kingdom era to today." },
      communityStories: { title: "Community Stories", description: "Farmers, villagers and others in their own words, shared with consent." },
    },
    secondary: {
      sources: "Data & Sources",
      methodology: "Methodology & Labels",
      contribute: "Contribute / Correct",
      about: "About",
      contact: "Contact",
    },
  },
  readMore: { more: "Read more", less: "Show less" },
  toc: { onThisPage: "On this page" },
  legalNotice: {
    label: "Legal notice",
    deaths:
      "This record spreads knowledge. It describes deaths as the listed sources report them, and is not an accusation against any person or community, or legal advice. Places are shown by district only.", // TODO(lawyer-review)
    court:
      "This archive shares information for public knowledge. It is not an accusation or legal advice. People named in cases are presumed innocent unless a court has convicted them.", // TODO(lawyer-review)
    short: "For public knowledge, not accusation or legal advice.", // TODO(lawyer-review)
  },
  // Shown only on si/ta pages, so each locale names its own language; English is the source text.
  translation: {
    partlyHeading: "This page is partly translated",
    partlyBody: 'Parts marked "Shown in English" are waiting for a native speaker to approve the translation.',
    missingHeading: "This page is not translated yet",
    missingBody: "It is shown in English below until a native speaker translates and approves it.",
    readInEnglish: "Read the whole page in English",
    helpTranslate: "Help translate this page",
    shownInEnglish: "Shown in English",
    reviewed: "Translation reviewed by a native speaker",
  },
};

export type Messages = typeof en;
