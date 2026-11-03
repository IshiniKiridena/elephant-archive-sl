import { APIError, type CollectionBeforeChangeHook, type CollectionConfig } from "payload";
import { adminsOnly, hasRole, legalField, staff } from "../access/roles";
import { TARGET_SPECS } from "../pipeline/targets"; // no LLM/fetch code is pulled into the app bundle
import { auditChange, auditDelete } from "./AuditLog";
import { SOURCE_TYPES, TARGETS, VERIFICATION, type Target } from "../pipeline/types";

const needsLegal = (t: Target) => !!TARGET_SPECS[t]?.legalReview;

/**
 * Staging area between intake and the real collections. Humans review here.
 * Guard rails are enforced in the hook (server side), not just the UI:
 *  - any edit to the proposed data or sources ⇒ back to "checking", approvals cleared
 *  - no approval while blocking findings exist or a recheck is pending
 *  - labels must be confirmed by the editor; reviewer ≠ editor; court cases need legal
 *  - status can't be set by hand
 */

const guard: CollectionBeforeChangeHook = ({ data, originalDoc, req, operation, context }) => {
  if (context?.pipeline) return data; // pipeline writes (local API) manage status themselves
  if (operation === "create") throw new APIError("Candidates are created by the pipeline. Add material through Intake.", 400);

  const user = req.user as { id: string | number } | null;
  const prev = originalDoc ?? {};
  const next = { ...data };
  const action = next.reviewAction as string | undefined;
  next.reviewAction = null;
  next.status = prev.status; // never set by hand

  const edited =
    JSON.stringify(next.proposed ?? prev.proposed) !== JSON.stringify(prev.proposed) ||
    (next.lawyerApproved ?? prev.lawyerApproved) !== prev.lawyerApproved;

  if (edited) {
    if (action && action !== "reject") throw new APIError("Save your edits first. Checks will rerun (pnpm ingest) before anyone can approve.", 400);
    return {
      ...next,
      status: "checking",
      needsRecheck: true,
      editorApprovedBy: null,
      reviewerApprovedBy: null,
      legalApprovedBy: null,
      warningsAcknowledged: false,
    };
  }

  if (!action) return next;
  const fail = (m: string) => {
    throw new APIError(m, 400);
  };
  const blocks = prev.blockCount ?? 0;
  const pending = prev.needsRecheck || prev.status === "checking";

  switch (action) {
    case "approve_editor": {
      if (!hasRole(user, "editor")) fail("Only editors can give the first approval.");
      if (prev.status !== "ready_for_review") fail(`Can't approve from status "${prev.status}".`);
      if (pending) fail("Checks are out of date. Run pnpm ingest first.");
      if (blocks > 0) fail(`${blocks} blocking finding(s) must be fixed first.`);
      if (!(next.confirmedSourceType ?? prev.confirmedSourceType) || !(next.confirmedVerification ?? prev.confirmedVerification))
        fail("Confirm both labels (source type and verification status) before approving.");
      if ((prev.warnCount ?? 0) > 0 && !(next.warningsAcknowledged ?? prev.warningsAcknowledged))
        fail("Tick 'I have read every warning' first.");
      return { ...next, status: "editor_approved", editorApprovedBy: user!.id };
    }
    case "approve_reviewer": {
      if (!hasRole(user, "reviewer")) fail("Only reviewers can give the second approval.");
      if (prev.status !== "editor_approved") fail("Needs the editor's approval first.");
      const editorId = typeof prev.editorApprovedBy === "object" ? prev.editorApprovedBy?.id : prev.editorApprovedBy;
      if (String(editorId) === String(user!.id)) fail("The second approval must come from a different person.");
      return { ...next, status: "reviewer_approved", reviewerApprovedBy: user!.id };
    }
    case "approve_legal": {
      if (!hasRole(user, "legal")) fail("Only the legal reviewer can approve this.");
      if (!needsLegal(prev.target as Target)) fail("This record doesn't need legal approval.");
      if (prev.status !== "reviewer_approved") fail("Needs editor and reviewer approval first.");
      return { ...next, status: "legal_approved", legalApprovedBy: user!.id };
    }
    case "reject": {
      if (!hasRole(user, "editor", "reviewer", "legal")) fail("Not allowed.");
      if (!(next.rejectionReason ?? prev.rejectionReason)) fail("Give a reason for rejecting.");
      return { ...next, status: "rejected" };
    }
    default:
      return next;
  }
};

const readOnly = { readOnly: true } as const;

export const Candidates: CollectionConfig = {
  slug: "candidates",
  admin: {
    group: "Fact-check pipeline",
    useAsTitle: "title",
    defaultColumns: ["title", "target", "status", "blockCount", "warnCount", "round"],
    listSearchableFields: ["title"],
    description: "Draft records found by the pipeline. Fix findings, confirm labels, approve. Nothing here is public.",
  },
  access: { read: staff, create: () => false, update: staff, delete: adminsOnly },
  hooks: { beforeChange: [guard], afterChange: [auditChange], afterDelete: [auditDelete] },
  fields: [
    { name: "title", type: "text", admin: readOnly },
    {
      type: "row",
      fields: [
        { name: "target", type: "select", options: [...TARGETS], admin: readOnly },
        { name: "status", type: "select", admin: readOnly, options: ["extracted", "checking", "needs_attention", "ready_for_review", "editor_approved", "reviewer_approved", "legal_approved", "promoted", "rejected"] },
        { name: "round", type: "number", admin: readOnly },
      ],
    },
    {
      type: "tabs",
      tabs: [
        {
          label: "Findings",
          fields: [
            { type: "row", fields: [{ name: "blockCount", type: "number", admin: readOnly }, { name: "warnCount", type: "number", admin: readOnly }] },
            { name: "openFindings", type: "json", admin: { ...readOnly, description: "Latest findings from all checks. Blocks must be fixed; warnings must be read." } },
            { name: "supportedBy", type: "json", admin: { ...readOnly, description: "What each source check concluded" } },
            { name: "archivedCopies", type: "json", admin: readOnly },
            { name: "matchExistingId", type: "text", admin: { ...readOnly, description: "If set, promotion adds sources to this existing record instead of creating one" } },
          ],
        },
        {
          label: "Proposed record",
          fields: [
            {
              name: "proposed",
              type: "json",
              admin: { description: "Edit values here. Any edit sends the record back through all checks and clears approvals. Evidence spans are internal and never published." },
            },
          ],
        },
        {
          label: "Labels & review",
          fields: [
            { type: "row", fields: [
              { name: "suggestedSourceType", type: "select", options: [...SOURCE_TYPES], admin: readOnly },
              { name: "suggestedVerification", type: "select", options: [...VERIFICATION], admin: readOnly },
            ] },
            { type: "row", fields: [
              { name: "confirmedSourceType", type: "select", options: [...SOURCE_TYPES], admin: { description: "Editor confirms" } },
              { name: "confirmedVerification", type: "select", options: [...VERIFICATION], admin: { description: "Editor confirms. Only a human may choose Verified" } },
            ] },
            { name: "warningsAcknowledged", type: "checkbox", label: "I have read every warning and checked the sources it mentions" },
            { name: "lawyerApproved", type: "checkbox", access: { update: legalField }, admin: { condition: (d) => d?.target === "courtCase" } },
            { name: "reviewNotes", type: "textarea" },
            { name: "rejectionReason", type: "text" },
            {
              name: "reviewAction",
              type: "select",
              options: [
                { label: "Approve (editor)", value: "approve_editor" },
                { label: "Approve (second reviewer)", value: "approve_reviewer" },
                { label: "Approve (legal)", value: "approve_legal" },
                { label: "Reject", value: "reject" },
              ],
              admin: { description: "Choose and save. Rules are checked on the server." },
            },
          ],
        },
      ],
    },
    // Sidebar / system
    { name: "batch", type: "relationship", relationTo: "intake-batches", admin: { position: "sidebar", readOnly: true } },
    { name: "bundleKey", type: "text", index: true, admin: { position: "sidebar", readOnly: true, description: "Records from the same intake are linked on promotion" } },
    { name: "localKey", type: "text", admin: { position: "sidebar", readOnly: true } },
    { name: "editorApprovedBy", type: "relationship", relationTo: "users", admin: { position: "sidebar", readOnly: true } },
    { name: "reviewerApprovedBy", type: "relationship", relationTo: "users", admin: { position: "sidebar", readOnly: true } },
    { name: "legalApprovedBy", type: "relationship", relationTo: "users", admin: { position: "sidebar", readOnly: true, condition: (d) => d?.target === "courtCase" } },
    { name: "needsRecheck", type: "checkbox", index: true, admin: { position: "sidebar", readOnly: true } },
    { name: "lastCheckedAt", type: "date", admin: { position: "sidebar", readOnly: true } },
    { name: "promotedRecord", type: "text", admin: { position: "sidebar", readOnly: true, description: "collection:id of the draft created" } },
  ],
};
