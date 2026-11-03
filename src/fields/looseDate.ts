import type { Field } from "payload";

/**
 * Dates as the sources state them: "2024", "2024-03" or "2024-03-10".
 * Many reports give only a month or year; storing a fake day would invent precision (rule 1).
 */
export const LOOSE_DATE = /^\d{4}(-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?)?$/;

export const looseDateField = (name: string, label: string, required = false, width?: string): Field => ({
  name,
  label,
  type: "text",
  required,
  index: true,
  admin: { placeholder: "YYYY, YYYY-MM or YYYY-MM-DD", description: "Only as precise as the source", ...(width ? { width } : {}) },
  validate: (v: unknown) =>
    (!required && (v === null || v === undefined || v === "")) ||
    (typeof v === "string" && LOOSE_DATE.test(v.trim())) ||
    "Use YYYY, YYYY-MM or YYYY-MM-DD",
});
