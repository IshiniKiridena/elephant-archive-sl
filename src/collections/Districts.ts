import { auditChange, auditDelete } from "./AuditLog";
import type { CollectionConfig } from "payload";
import { adminsOnly, hasRole } from "../access/roles";
import { translationReviewField } from "../fields/evidence";

/**
 * The 25 districts: the finest place level the archive ever stores (rule 4).
 * There is deliberately no coordinates field. Map shapes come from a static boundary file
 * keyed by `slug`, never from the database.
 * English names are seeded (`pnpm seed:districts`); Sinhala/Tamil names are added by editors
 * and approved by native speakers.
 */
export const Districts: CollectionConfig = {
  slug: "districts",
  admin: { useAsTitle: "name", defaultColumns: ["name", "province", "slug"], group: "Archive" },
  hooks: { afterChange: [auditChange], afterDelete: [auditDelete] },
  access: { read: () => true, create: adminsOnly, update: ({ req }) => hasRole(req.user, "editor"), delete: adminsOnly },
  fields: [
    { name: "name", type: "text", required: true, localized: true },
    { name: "slug", type: "text", required: true, unique: true, index: true, admin: { readOnly: true } },
    {
      name: "province",
      type: "select",
      required: true,
      options: [
        { label: "Western", value: "western" },
        { label: "Central", value: "central" },
        { label: "Southern", value: "southern" },
        { label: "Northern", value: "northern" },
        { label: "Eastern", value: "eastern" },
        { label: "North Western", value: "north_western" },
        { label: "North Central", value: "north_central" },
        { label: "Uva", value: "uva" },
        { label: "Sabaragamuwa", value: "sabaragamuwa" },
      ],
    },
    translationReviewField(),
  ],
};

export const DISTRICT_SEED: { name: string; province: string }[] = [
  { name: "Colombo", province: "western" },
  { name: "Gampaha", province: "western" },
  { name: "Kalutara", province: "western" },
  { name: "Kandy", province: "central" },
  { name: "Matale", province: "central" },
  { name: "Nuwara Eliya", province: "central" },
  { name: "Galle", province: "southern" },
  { name: "Matara", province: "southern" },
  { name: "Hambantota", province: "southern" },
  { name: "Jaffna", province: "northern" },
  { name: "Kilinochchi", province: "northern" },
  { name: "Mannar", province: "northern" },
  { name: "Vavuniya", province: "northern" },
  { name: "Mullaitivu", province: "northern" },
  { name: "Batticaloa", province: "eastern" },
  { name: "Ampara", province: "eastern" },
  { name: "Trincomalee", province: "eastern" },
  { name: "Kurunegala", province: "north_western" },
  { name: "Puttalam", province: "north_western" },
  { name: "Anuradhapura", province: "north_central" },
  { name: "Polonnaruwa", province: "north_central" },
  { name: "Badulla", province: "uva" },
  { name: "Monaragala", province: "uva" },
  { name: "Ratnapura", province: "sabaragamuwa" },
  { name: "Kegalle", province: "sabaragamuwa" },
];

export const districtSlug = (name: string) => name.toLowerCase().replace(/\s+/g, "-");
