import type { CollectionConfig } from "payload";
import { adminsOnly, nobody, staff } from "../access/roles";

/** Audit trail: every check, every round. Written only by the pipeline (local API). */
export const CheckRuns: CollectionConfig = {
  slug: "check-runs",
  admin: {
    group: "Fact-check pipeline",
    defaultColumns: ["candidate", "round", "check", "result", "ranAt"],
  },
  access: { read: staff, create: nobody, update: nobody, delete: adminsOnly },
  fields: [
    { name: "candidate", type: "relationship", relationTo: "candidates", required: true, index: true },
    { name: "round", type: "number", required: true },
    {
      name: "check",
      type: "select",
      required: true,
      options: ["grounding", "dual_read", "sources", "consistency", "rules", "pre_promote"],
    },
    { name: "result", type: "select", options: ["pass", "warn", "block", "skipped"] },
    { name: "findings", type: "json" },
    { name: "note", type: "text" },
    { name: "ranAt", type: "date", admin: { date: { pickerAppearance: "dayAndTime" } } },
  ],
};
