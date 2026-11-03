import { runRules } from "../rules";
import { checkGrounding, csvToRecords } from "../text";
import { mergeDualRead } from "../dualread";
import { suggestVerification } from "../labels";
import type { ProposedRecord } from "../types";

let fails = 0;
const expect = (name: string, cond: boolean) => { console.log(`${cond ? "PASS" : "FAIL"}  ${name}`); if (!cond) fails++; };
const ctx = { now: new Date("2026-11-03"), embargoDays: 180, lawyerApproved: false };
const src = [{ url: "https://example.org/a", publisher: "Outlet A", sourceType: "news" as const }];

const death = (over: Partial<ProposedRecord> = {}): ProposedRecord => ({
  localKey: "r1", target: "elephantDeath", summary: "Adult male died after a train collision",
  fields: { date: { value: "2025-03-10", evidence: "on March 10" }, district: { value: "Polonnaruwa", evidence: "Polonnaruwa district" }, cause: { value: "train_collision", evidence: "struck by a train" } },
  sources: src, links: [], mentionsPrivatePersons: false, inputLanguage: "en", ...over,
});
const blocks = (r: ProposedRecord) => runRules(r, ctx).filter((f) => f.severity === "block");

expect("clean death passes", blocks(death()).length === 0);
expect("village instead of district blocks", blocks(death({ fields: { ...death().fields, district: { value: "Some Village", evidence: "x" } } })).length > 0);
expect("coordinates block", blocks(death({ summary: "Found at 7.9403, 81.0188" })).length > 0);
expect("no source blocks", blocks(death({ sources: [] })).length > 0);
expect("long quote blocks", blocks(death({ summary: '"one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen"' })).length > 0);
expect("sensational word warns", runRules(death({ summary: "A horrific death" }), ctx).some((f) => f.severity === "warn" && /horrific/.test(f.message)));

const living: ProposedRecord = { localKey: "r2", target: "lifeEvent", summary: "Treated for an injury",
  fields: { kind: { value: "treatment", evidence: "x" }, date: { value: "2026-10-01", evidence: "x" }, district: { value: "Ampara", evidence: "x" } },
  sources: src, links: [], mentionsPrivatePersons: false, inputLanguage: "en" };
expect("recent living-elephant event blocked by embargo", blocks(living).some((f) => /embargo/.test(f.message)));
expect("old living-elephant event allowed", blocks({ ...living, fields: { ...living.fields, date: { value: "2024-01-05", evidence: "x" } } }).length === 0);
expect("year-only recent date treated as recent", blocks({ ...living, fields: { ...living.fields, date: { value: "2026", evidence: "x" } } }).some((f) => /embargo/.test(f.message)));
expect("'last seen' blocks", blocks({ ...living, summary: "He was last seen near the tank" }).length > 0);

const court: ProposedRecord = { localKey: "r3", target: "courtCase", summary: "Two suspects were charged over the alleged shooting",
  fields: { caseStatus: { value: "charged", evidence: "x" } }, sources: src, links: [], mentionsPrivatePersons: false, inputLanguage: "en" };
expect("neutral charged case passes", blocks(court).length === 0);
expect("'guilty' before conviction blocks", blocks({ ...court, summary: "The guilty men were charged" }).length > 0);
expect("named private persons block without lawyer", blocks({ ...court, mentionsPrivatePersons: true }).length > 0);
expect("named private persons ok with lawyer approval", runRules({ ...court, mentionsPrivatePersons: true }, { ...ctx, lawyerApproved: true }).filter((f) => f.severity === "block").length === 0);
expect("'guilty' allowed after conviction", blocks({ ...court, summary: "Found guilty", fields: { caseStatus: { value: "convicted", evidence: "x" } } }).length === 0);

expect("sinhala text warns for review", runRules(death({ summary: "අලියා" }), ctx).some((f) => /native/i.test(f.message) || /Sinhala/.test(f.message)));
expect("community story without consent blocks", blocks({ localKey: "c", target: "communityStory", summary: "A farmer's account", fields: { summary: { value: "A farmer's account", evidence: "x" } }, sources: src, links: [], mentionsPrivatePersons: false, inputLanguage: "en" }).length > 0);

// grounding
const material = "The elephant was struck by a train on March 10 in Polonnaruwa district, officials said.";
expect("grounded fields pass", checkGrounding(death(), material, false).length === 0);
expect("invented evidence blocks", checkGrounding(death({ fields: { ...death().fields, cause: { value: "gunshot", evidence: "was shot twice" } } }), material, false).some((f) => f.severity === "block"));
expect("invented evidence only warns when screenshots present", checkGrounding(death({ fields: { ...death().fields, cause: { value: "gunshot", evidence: "was shot twice" } } }), material, true).every((f) => f.severity === "warn"));

// dual read
const a = [death()];
const b = [death({ fields: { ...death().fields, cause: { value: "electrocution", evidence: "x" } } })];
const merged = mergeDualRead(a, b);
expect("dual read flags disagreement", merged[0].findings.some((f) => /disagree/.test(f.message)));
const merged2 = mergeDualRead(a, [living]);
expect("dual read keeps B-only record with warning", merged2.length === 2 && merged2[1].findings[0].message.includes("Only read B"));

// labels
expect("one outlet → single_source", suggestVerification(src, false) === "single_source");
expect("two outlets → multiple_outlets", suggestVerification([...src, { url: "https://other.lk/x", publisher: "Outlet B", sourceType: "news" }], false) === "multiple_outlets");
expect("social only → unverified", suggestVerification([{ url: "https://facebook.com/x", sourceType: "social_media" }], false) === "unverified");
expect("disputed wins", suggestVerification(src, true) === "disputed");

// CSV offline
const rows = csvToRecords("summary,date,district,cause,source_url,source_type\nTest,2024-02-01,Anuradhapura,electrocution,https://example.org/r,official\n", "elephantDeath");
expect("csv row → record", rows.length === 1 && rows[0].fields.district.value === "Anuradhapura" && rows[0].sources[0].sourceType === "official");
expect("csv record passes rules", blocks(rows[0]).length === 0);

console.log(fails ? `\n${fails} FAILED` : "\nall passed");
process.exit(fails ? 1 : 0);
