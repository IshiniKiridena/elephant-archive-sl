import type { Target } from "./types";

/**
 * Where each target lives and which fields the extractor may fill.
 * Field names mirror the models in planning/phases.md. Edit here when a collection changes.
 * No field may hold coordinates or a place finer than district.
 */
export interface TargetSpec {
  collection: string; // Payload collection slug
  fields: Record<string, string>; // name → guidance for the extractor
  required: string[];
  nameField?: string; // used to match existing records ("Kavantissa")
  dateField?: string;
  districtField?: string;
  /** Living subjects get the location embargo. */
  aboutLivingElephant?: (fields: Record<string, unknown>) => boolean;
  legalReview?: boolean;
  quiet?: boolean; // Quiet-zone content (no motion, no hero photos)
}

export const TARGET_SPECS: Record<Target, TargetSpec> = {
  source: {
    collection: "sources",
    fields: {
      title: "Title of the article/document/post",
      publisher: "Outlet, agency or account name",
      url: "URL if known",
      date: "Publication date (YYYY-MM-DD, YYYY-MM or YYYY)",
    },
    required: ["title"],
  },
  elephantDeath: {
    collection: "elephant-deaths",
    fields: {
      date: "Date of death (YYYY-MM-DD, YYYY-MM or YYYY)",
      datePrecision: "day | month | year",
      district: "Sri Lankan district only (e.g. Polonnaruwa). Never a village, road or GPS",
      sex: "male | female | unknown",
      ageClass: "calf | juvenile | sub_adult | adult | unknown",
      tusker: "true | false | unknown",
      cause: "slug from the cause taxonomy: train_collision, electrocution, gunshot, poisoning, trap_explosive, garbage_related, disease_parasites, natural, unknown",
      causeConfirmation: "confirmed_by_post_mortem | reported | suspected | unknown",
      elephantName: "Name if the elephant was known by one",
    },
    required: ["date", "district", "cause"],
    dateField: "date",
    districtField: "district",
    quiet: true,
  },
  elephant: {
    collection: "elephants",
    fields: {
      nameEn: "Name in English",
      nameSi: "Name in Sinhala script if given in input",
      nameTa: "Name in Tamil script if given in input",
      sex: "male | female | unknown",
      tusker: "true | false | unknown",
      estimatedBirthYear: "Year, only if stated",
      status: "living | deceased | unknown",
    },
    required: ["nameEn"],
    nameField: "nameEn",
    aboutLivingElephant: (f) => f.status !== "deceased",
  },
  lifeEvent: {
    collection: "life-events",
    fields: {
      kind: "birth | rescue | injury | treatment | relocation | sighting_reported | death | other",
      date: "Date (YYYY-MM-DD, YYYY-MM or YYYY)",
      district: "District only",
      description: "One neutral sentence in your own words",
    },
    required: ["kind", "date"],
    dateField: "date",
    districtField: "district",
    aboutLivingElephant: (f) => f.kind !== "death",
  },
  rescue: {
    collection: "rescues",
    fields: {
      incidentType: "well_or_pit | injury | orphaned_calf | trapped | stranded | other",
      date: "Date",
      district: "District only",
      agency: "Agency involved (e.g. Department of Wildlife Conservation)",
      outcome: "released | in_care | died | unknown",
    },
    required: ["incidentType", "date", "district"],
    dateField: "date",
    districtField: "district",
    aboutLivingElephant: (f) => f.outcome !== "died",
  },
  courtCase: {
    collection: "court-cases",
    fields: {
      caseStatus: "reported | charged | pending | acquitted | convicted | closed",
      court: "Court name",
      filingDate: "Date",
      district: "District",
      summary: "One neutral sentence using 'alleged'/'accused' unless convicted. No names of private individuals",
      partyRoles: "Roles only, e.g. 'two suspects', 'a businessman'. Never names here",
    },
    required: ["caseStatus"],
    dateField: "filingDate",
    districtField: "district",
    legalReview: true,
    quiet: true,
  },
  governmentAction: {
    collection: "government-actions",
    fields: {
      kind: "law | gazette | policy | programme | statement | other",
      date: "Date",
      body: "Ministry, department or court that acted",
      title: "Short neutral title",
      description: "One sentence, own words",
    },
    required: ["kind", "date", "title"],
    dateField: "date",
  },
  historyItem: {
    collection: "history-items",
    fields: {
      era: "kingdom | colonial | post_independence | modern",
      dateText: "Year or period as stated (e.g. 'c. 1300s')",
      title: "Short title",
      description: "One sentence, own words",
    },
    required: ["title", "era"],
  },
  communityStory: {
    collection: "community-stories",
    fields: {
      district: "District only",
      year: "Year of the events",
      perspective: "farmer | villager | wildlife_officer | researcher | mahout | other",
      summary: "One neutral sentence",
      consentRecorded: "true only if the input says the storyteller consented to publication",
    },
    required: ["summary"],
    districtField: "district",
  },
  fact: {
    collection: "facts",
    fields: {
      statement: "One factual sentence in your own words",
      topic: "biology | behaviour | ecology | history | culture | conflict | conservation | law",
    },
    required: ["statement"],
  },
  humanDeathAggregate: {
    collection: "human-death-aggregates",
    fields: {
      year: "Year",
      district: "District, or 'national'",
      count: "Number as stated by the source",
      metric: "What the number counts, as stated",
    },
    required: ["year", "count"],
    districtField: "district",
    quiet: true,
  },
};

export const SRI_LANKA_DISTRICTS = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle", "Gampaha",
  "Hambantota", "Jaffna", "Kalutara", "Kandy", "Kegalle", "Kilinochchi", "Kurunegala",
  "Mannar", "Matale", "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya", "Polonnaruwa",
  "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya",
] as const;

export const normaliseDistrict = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  const s = v.trim().toLowerCase().replace(/\s+district$/, "");
  if (s === "national") return "national";
  return SRI_LANKA_DISTRICTS.find((d) => d.toLowerCase() === s) ?? null;
};
