import { auditChange, auditDelete } from "./AuditLog";
import type { CollectionConfig, FieldAccess } from "payload";
import { adminsOnly, hasRole } from "../access/roles";

/**
 * Staff accounts only (no public sign-up). Roles drive every approval rule:
 *  editor   → first approval, confirms labels
 *  reviewer → second approval (must be a different person)
 *  legal    → approves court-case candidates
 *  admin    → everything, manages users
 * The very first account created becomes admin automatically.
 */
const adminField: FieldAccess = ({ req }) => hasRole(req.user);

export const Users: CollectionConfig = {
  slug: "users",
  admin: { useAsTitle: "email", defaultColumns: ["email", "name", "roles"], group: "Admin" },
  auth: true,
  access: {
    read: ({ req }) => (hasRole(req.user) ? true : req.user ? { id: { equals: req.user.id } } : false),
    create: async ({ req }) => {
      if (hasRole(req.user)) return true;
      const { totalDocs } = await req.payload.count({ collection: "users", overrideAccess: true });
      return totalDocs === 0; // bootstrap: first user may self-register in the admin
    },
    update: ({ req }) => (hasRole(req.user) ? true : req.user ? { id: { equals: req.user.id } } : false),
    delete: adminsOnly,
  },
  hooks: {
    afterChange: [auditChange],
    afterDelete: [auditDelete],
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation !== "create") return data;
        const { totalDocs } = await req.payload.count({ collection: "users", overrideAccess: true });
        return totalDocs === 0 ? { ...data, roles: ["admin"] } : data;
      },
    ],
  },
  fields: [
    { name: "name", type: "text" },
    {
      name: "roles",
      type: "select",
      hasMany: true,
      required: true,
      defaultValue: ["editor"],
      saveToJWT: true,
      options: [
        { label: "Admin", value: "admin" },
        { label: "Editor", value: "editor" },
        { label: "Reviewer", value: "reviewer" },
        { label: "Legal reviewer", value: "legal" },
      ],
      access: { update: adminField, create: adminField },
    },
  ],
};
