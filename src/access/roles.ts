import type { Access, FieldAccess } from "payload";

/** Assumes the Users collection has `roles: ("admin" | "editor" | "reviewer" | "legal")[]` (Phase 0). */
export type Role = "admin" | "editor" | "reviewer" | "legal";

export const hasRole = (user: unknown, ...roles: Role[]) =>
  !!user && Array.isArray((user as { roles?: Role[] }).roles) && (user as { roles: Role[] }).roles.some((r) => r === "admin" || roles.includes(r));

export const staff: Access = ({ req }) => hasRole(req.user, "editor", "reviewer", "legal");
export const editors: Access = ({ req }) => hasRole(req.user, "editor");
export const adminsOnly: Access = ({ req }) => hasRole(req.user);
export const legalField: FieldAccess = ({ req }) => hasRole(req.user, "legal");
export const nobody: Access = () => false;
