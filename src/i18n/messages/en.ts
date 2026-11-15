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
  // Alt text of the logo in the header and footer: the words the logo shows
  brand: {
    logoAlt: "Elephant Archive Sri Lanka",
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
  // Public page for one source (design: Source page)
  sourcePage: {
    breadcrumb: "Breadcrumb",
    home: "Home",
    eyebrow: "Source",
    language: "Language",
    languageName: { si: "Sinhala", ta: "Tamil", en: "English", other: "Another language" },
    live: "The page was live when we last checked.",
    lastChecked: "Last checked",
    copyCitation: "Copy citation",
    citationCopied: "Citation copied",
    labelsHeading: "What the labels on this source mean",
    sourceTypeHeading: "Source type",
    verificationHeading: "How far it's checked",
    sourceTypeText: {
      official: "Published by a government body, such as a ministry, department or the police, in its own name.",
      court_record: "A filing, order or judgment from a court. Cases are described as alleged until a court convicts.", // TODO(lawyer-review)
      academic: "A peer-reviewed paper, thesis or research report.",
      news: "Reported by a news outlet. The outlet may be quoting officials or witnesses.",
      organisation: "Published by a conservation group, NGO or other organisation.",
      community: "An account from someone with first-hand experience, shared with consent.",
      social_media: "A post on social media. Treated with caution until other sources confirm it.",
      unverified: "We could not identify who published this or how reliable it is.",
    } satisfies Record<SourceType, string>,
    verificationText: {
      verified: "Checked by our editors against the original documents or independent sources.",
      multiple_outlets: "More than one independent outlet reports the same thing.",
      single_source: "Only this source reports it so far. It may be accurate, but no one else confirms it yet.",
      disputed: "Other sources disagree with this one. Records that cite it show each version side by side.",
      unverified: "Not yet checked. Treat with caution.",
    } satisfies Record<VerificationStatus, string>,
    methodLink: "How we label evidence",
    recordsHeading: "Records that cite this source",
    recordsNote: "Each record keeps its own labels.",
    noRecords: "No published records cite this source yet.",
    copyright: "We link to sources and describe them in our own words. We don't copy articles, and any quote is kept short.",
    detailsHeading: "Details",
    detailsLabel: "Source details",
    publisher: "Publisher",
    verification: "Verification",
    link: "Link",
    linkLabel: { live: "Live", corrected: "Corrected by publisher", unreachable: "Unreachable", removed: "Removed by publisher" },
    archivedCopy: "Archived copy",
    none: "None",
    citeHeading: "Cite this source",
    accessed: "Accessed",
    wrongHeading: "Something wrong?",
    wrongBody: "If this source is misdescribed, its link is broken, or you know a better one, tell us. People review every correction.",
    reportCorrection: "Report a correction",
  },
  // Shown only to staff who turned on draft preview from the admin
  preview: {
    banner: "Draft preview",
    body: "You're seeing unpublished changes. Visitors don't see this.",
    exit: "Exit preview",
  },
};

export type Messages = typeof en;
