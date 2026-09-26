"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { LONG_FORM_MODULE } from "@/lib/domain/longform";
import { auditInternal } from "@/lib/auth/audit";
import { requireInternalStrict } from "@/lib/auth/guard";
import { emailDeliveryConfigured } from "@/lib/email";
import { provisionClientWorkspace, ProvisionError } from "@/lib/commercial/provision";
import { InvitationError } from "@/lib/team/invitations";
import { parseStringArray, stringify, stringifyArray } from "@/lib/db/json";
import {
  applicationStatusSchema,
  issueStatusSchema,
  orgStatusSchema,
  packageTierSchema,
  severitySchema,
  sopCategorySchema,
} from "@/lib/domain/enums";
import {
  checkbox,
  cleanText,
  cleanUrl,
  commaField,
  err,
  guarded,
  ok,
  okVoid,
  parseForm,
  type ActionResult,
} from "./shared";

/**
 * Admin portal mutations.
 *
 * Every action here is guarded by `requireInternal()`. A client role cannot
 * reach these because there is no client route that imports this module and the
 * guard re-checks on every call regardless.
 */

/* ------------------------------- Client setup -------------------------------- */

const createClientSchema = z.object({
  name: z.string().min(2, "Enter the company name.").max(200),
  slug: z
    .string()
    .min(2, "Enter a workspace slug.")
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only."),
  website: z.string().max(300).optional(),
  industry: z.string().max(200).optional(),
  geography: z.string().max(200).optional(),
  packageTier: packageTierSchema.default("install"),
  currency: z.enum(["GBP", "USD", "EUR"]).default("GBP"),
  setupFee: z.coerce.number().min(0).default(0),
  periodFee: z.coerce.number().min(0).default(0),
  cadencePerWeek: z.coerce.number().int().min(0).max(50).default(3),
  platforms: commaField,
  founderName: z.string().min(2, "Enter the founder's name.").max(120),
  founderEmail: z.string().email("Enter a valid email address.").max(200),
  seedTemplate: checkbox,
});

/**
 * Create a client workspace from the master template.
 *
 * "80–90% of the product is identical between clients; only configuration
 * changes" — so this scaffolds the standard structure (SOP-aligned pillars,
 * integration rows, first tasks, onboarding session) and leaves the rest to
 * onboarding.
 */
export async function createClientAction(
  _prev: ActionResult<{ slug: string; inviteLink: string | null }> | null,
  formData: FormData,
): Promise<ActionResult<{ slug: string; inviteLink: string | null }>> {
  return guarded(async () => {
    const admin = await requireInternalStrict("admin.clients.manage");
    const input = parseForm(createClientSchema, formData);
    try {
      const { org, inviteLink } = await provisionClientWorkspace(
        { userId: admin.user.id, name: admin.user.name, role: admin.role },
        {
          name: cleanText(input.name, 200),
          slug: input.slug,
          website: cleanUrl(input.website),
          industry: input.industry ?? null,
          geography: input.geography ?? null,
          currency: input.currency,
          packageTier: input.packageTier,
          cadencePerWeek: input.cadencePerWeek,
          platforms: input.platforms,
          seedTemplate: input.seedTemplate,
          founder: { name: cleanText(input.founderName, 120), email: input.founderEmail },
          feeOverrides: { setupFeeMinor: Math.round(input.setupFee * 100), periodFeeMinor: Math.round(input.periodFee * 100) },
        },
      );
      await auditInternal(admin.user.id, { orgId: org.id, action: "client.create", entityType: "organization", entityId: org.id, summary: `Created client workspace "${org.name}" and invited its founder`, meta: { slug: org.slug } });
      revalidatePath("/admin");
      revalidatePath("/admin/clients");
      const captured = !emailDeliveryConfigured();
      return ok({ slug: org.slug, inviteLink: captured ? inviteLink : null }, `${org.name} created. The founder has been invited${captured ? "; email is not configured here, so share the link directly" : ""}.`);
    } catch (e) {
      if (e instanceof ProvisionError || e instanceof InvitationError) return err(e.message, "validation", e.message.includes("slug") ? { slug: "Already in use." } : undefined);
      throw e;
    }
  });
}

const convertSchema = z.object({
  applicationId: z.string().min(1),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only."),
  name: z.string().min(2).max(200),
  offerKey: z.string().max(60).default("standard"),
});

/**
 * Convert an accepted application into a client (COM-03): workspace, draft
 * engagement on the chosen offer, founder invitation and CRM records, in one
 * step. Converting twice returns the first result.
 */
export async function convertApplicationAction(
  _prev: ActionResult<{ slug: string; inviteLink: string | null }> | null,
  formData: FormData,
): Promise<ActionResult<{ slug: string; inviteLink: string | null }>> {
  return guarded(async () => {
    const admin = await requireInternalStrict("admin.applications");
    const input = parseForm(convertSchema, formData);
    const app = await prisma.application.findUnique({ where: { id: input.applicationId } });
    if (!app) return err("That application no longer exists.", "not_found");
    try {
      const { org, inviteLink, alreadyConverted } = await provisionClientWorkspace(
        { userId: admin.user.id, name: admin.user.name, role: admin.role },
        {
          name: cleanText(input.name, 200),
          slug: input.slug,
          website: cleanUrl(app.website),
          founder: { name: app.name, email: app.email },
          offerKey: input.offerKey,
          sourceApplicationId: app.id,
          sourceProspectId: app.prospectId,
          platforms: parseStringArray(app.platforms),
        },
      );
      if (!alreadyConverted) {
        await auditInternal(admin.user.id, { orgId: org.id, action: "application.convert", entityType: "application", entityId: app.id, summary: `Converted ${app.company} into a client workspace and invited ${app.name}` });
      }
      revalidatePath("/admin/applications");
      revalidatePath("/admin/clients");
      const captured = !emailDeliveryConfigured();
      return ok({ slug: org.slug, inviteLink: captured ? inviteLink : null }, alreadyConverted ? "Already converted; opening the existing workspace." : `${app.company} is now a client. ${app.name} has been invited.`);
    } catch (e) {
      if (e instanceof ProvisionError || e instanceof InvitationError) return err(e.message, "validation");
      throw e;
    }
  });
}

const updateClientSchema = z.object({
  name: z.string().min(2).max(200),
  status: orgStatusSchema,
  packageTier: packageTierSchema,
  website: z.string().max(300).optional(),
  industry: z.string().max(200).optional(),
  geography: z.string().max(200).optional(),
  setupFee: z.coerce.number().min(0).default(0),
  periodFee: z.coerce.number().min(0).default(0),
  supportNotes: z.string().max(4000).optional(),
  accentHex: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour such as #C8A96B.")
    .optional()
    .or(z.literal("")),
});

export async function updateClientAction(
  orgId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("admin.clients.manage");
    const input = parseForm(updateClientSchema, formData);

    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org || org.kind !== "client") return err("That client no longer exists.", "not_found");

    // ENG-02: once an engagement is live its signed terms are the authority;
    // fees change only through an approved scope change. A draft follows the form.
    const newSetup = Math.round(input.setupFee * 100);
    const newPeriod = Math.round(input.periodFee * 100);
    if (newSetup !== org.setupFee || newPeriod !== org.periodFee) {
      const live = await prisma.engagement.findFirst({ where: { orgId, status: { in: ["active", "paused"] } }, select: { id: true } });
      if (live) return err("This client's engagement is live, so its fees change through a scope change on the engagement, not here.", "workflow", { periodFee: "Use a scope change." });
      await prisma.engagement.updateMany({ where: { orgId, status: "draft" }, data: { setupFeeMinor: newSetup, periodFeeMinor: newPeriod } });
    }

    await prisma.organization.update({
      where: { id: orgId },
      data: {
        name: cleanText(input.name, 200),
        status: input.status,
        packageTier: input.packageTier,
        website: cleanUrl(input.website),
        industry: input.industry ?? null,
        geography: input.geography ?? null,
        setupFee: Math.round(input.setupFee * 100),
        periodFee: Math.round(input.periodFee * 100),
        supportNotes: input.supportNotes ? cleanText(input.supportNotes) : null,
        accentHex: input.accentHex || null,
      },
    });

    await auditInternal(admin.user.id, {
      orgId,
      action: "client.update",
      entityType: "organization",
      entityId: orgId,
      summary: `Updated client "${input.name}"`,
    });
    revalidatePath("/admin/clients");
    revalidatePath(`/admin/clients/${orgId}`);

    return okVoid("Client updated.");
  });
}

/* ------------------------------- Support issues ------------------------------ */

const issueSchema = z.object({
  title: z.string().min(4, "Describe the issue.").max(300),
  description: z.string().max(6000).optional(),
  severity: severitySchema.default("medium"),
  status: issueStatusSchema.default("open"),
  orgId: z.string().optional(),
  ownerId: z.string().optional(),
  resolution: z.string().max(4000).optional(),
  becomesSop: checkbox,
  becomesFix: checkbox,
});

export async function saveSupportIssueAction(
  issueId: string | null,
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const admin = await requireInternalStrict("admin.support");
    const input = parseForm(issueSchema, formData);

    const data = {
      title: cleanText(input.title, 300),
      description: input.description ? cleanText(input.description) : null,
      severity: input.severity,
      status: input.status,
      orgId: input.orgId || null,
      ownerId: input.ownerId || null,
      resolution: input.resolution ? cleanText(input.resolution) : null,
      becomesSop: input.becomesSop,
      becomesFix: input.becomesFix,
      resolvedAt: input.status === "resolved" ? new Date() : null,
    };

    let id = issueId;
    if (issueId) {
      const existing = await prisma.supportIssue.findUnique({ where: { id: issueId } });
      if (!existing) return err("That issue no longer exists.", "not_found");
      await prisma.supportIssue.update({ where: { id: issueId }, data });
    } else {
      const created = await prisma.supportIssue.create({ data });
      id = created.id;
    }

    await auditInternal(admin.user.id, {
      orgId: input.orgId || null,
      action: issueId ? "issue.update" : "issue.create",
      entityType: "support_issue",
      entityId: id,
      summary: `${issueId ? "Updated" : "Logged"} issue "${input.title}"`,
    });
    revalidatePath("/admin/support");

    return ok({ id: id as string }, issueId ? "Issue updated." : "Issue logged.");
  });
}

export async function deleteSupportIssueAction(issueId: string): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("admin.support");
    const issue = await prisma.supportIssue.findUnique({ where: { id: issueId } });
    if (!issue) return err("That issue no longer exists.", "not_found");

    await prisma.supportIssue.delete({ where: { id: issueId } });
    await auditInternal(admin.user.id, {
      action: "issue.delete",
      entityType: "support_issue",
      entityId: issueId,
      summary: `Deleted issue "${issue.title}"`,
    });
    revalidatePath("/admin/support");

    return okVoid("Issue deleted.");
  });
}

/* ----------------------------------- SOPs ------------------------------------ */

const sopSchema = z.object({
  title: z.string().min(3).max(200),
  category: sopCategorySchema,
  summary: z.string().max(500).optional(),
  body: z.string().max(60000).optional(),
});

export async function saveSopAction(
  sopKey: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("admin.sops");
    const input = parseForm(sopSchema, formData);

    const existing = await prisma.sopDocument.findUnique({ where: { key: sopKey } });
    if (!existing) return err("That document no longer exists.", "not_found");

    await prisma.sopDocument.update({
      where: { key: sopKey },
      data: {
        title: cleanText(input.title, 200),
        category: input.category,
        summary: input.summary ?? null,
        body: input.body ? cleanText(input.body, 60000) : "",
        version: existing.version + 1,
        updatedById: admin.user.id,
      },
    });

    await auditInternal(admin.user.id, {
      action: "sop.update",
      entityType: "sop",
      entityId: sopKey,
      summary: `Updated SOP "${input.title}" (v${existing.version + 1})`,
    });
    revalidatePath("/admin/sops");
    revalidatePath(`/admin/sops/${sopKey}`);

    return okVoid(`Saved as version ${existing.version + 1}.`);
  });
}

/* -------------------------------- Applications ------------------------------- */

export async function updateApplicationStatusAction(
  applicationId: string,
  status: string,
  reviewNotes?: string,
): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("admin.applications");
    const target = applicationStatusSchema.parse(status);

    const application = await prisma.application.findUnique({ where: { id: applicationId } });
    if (!application) return err("That application no longer exists.", "not_found");

    await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: target,
        reviewNotes: reviewNotes ? cleanText(reviewNotes, 4000) : application.reviewNotes,
      },
    });

    await auditInternal(admin.user.id, {
      action: "application.status",
      entityType: "application",
      entityId: applicationId,
      summary: `Moved ${application.company}'s application to ${target.replace(/_/g, " ")}`,
    });
    revalidatePath("/admin/applications");

    return okVoid("Application updated.");
  });
}

/* ------------------------------ Internal metrics ----------------------------- */

const internalMetricSchema = z.object({
  periodStart: z.string().min(4),
  salesCalls: z.coerce.number().int().min(0).default(0),
  showRatePct: z.coerce.number().min(0).max(100).default(0),
  closeRatePct: z.coerce.number().min(0).max(100).default(0),
  cashCollected: z.coerce.number().min(0).default(0),
  setupFees: z.coerce.number().min(0).default(0),
  mrr: z.coerce.number().min(0).default(0),
  implementationHours: z.coerce.number().min(0).default(0),
  supportHours: z.coerce.number().min(0).default(0),
  leadsBySource: z.string().max(2000).optional(),
});

export async function saveInternalMetricAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("admin.metrics");
    const input = parseForm(internalMetricSchema, formData);

    const periodStart = new Date(input.periodStart);
    if (Number.isNaN(periodStart.getTime())) {
      return err("Enter a valid period start date.", "validation", { periodStart: "Invalid date." });
    }
    periodStart.setHours(0, 0, 0, 0);

    // "linkedin: 4, referral: 2" becomes { linkedin: 4, referral: 2 }
    const leadsBySource: Record<string, number> = {};
    for (const pair of (input.leadsBySource ?? "").split(",")) {
      const [key, value] = pair.split(":").map((s) => s.trim());
      if (key && value && !Number.isNaN(Number(value))) leadsBySource[key] = Number(value);
    }

    const data = {
      salesCalls: input.salesCalls,
      showRatePct: input.showRatePct,
      closeRatePct: input.closeRatePct,
      cashCollectedMinor: Math.round(input.cashCollected * 100),
      setupFeesMinor: Math.round(input.setupFees * 100),
      mrrMinor: Math.round(input.mrr * 100),
      implementationHours: input.implementationHours,
      supportHours: input.supportHours,
      leadsBySource: stringify(leadsBySource),
    };

    await prisma.internalMetric.upsert({
      where: { periodStart },
      create: { periodStart, ...data },
      update: data,
    });

    await auditInternal(admin.user.id, {
      action: "metrics.save",
      entityType: "internal_metric",
      summary: `Recorded business metrics for ${periodStart.toLocaleDateString("en-GB")}`,
    });
    revalidatePath("/admin/metrics");

    return okVoid("Metrics saved.");
  });
}

/* ------------------------------ Long-form pilot ----------------------------- */

/**
 * Enable or disable long-form for a client.
 *
 * Deliberately its own action, capability-gated and audited. Long-form is a
 * different production shape with its own capacity cost, so it should never be
 * something that arrives by editing a dropdown on a settings form — the whole
 * point is that somebody chose it, on a date, against an agreed scope.
 */
export async function setLongFormScopeAction(
  orgId: string,
  enabled: boolean,
): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("longform.manage");

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, kind: true, name: true, modulesEnabled: true },
    });
    if (!org || org.kind !== "client") return err("That client no longer exists.", "not_found");

    const modules = new Set<string>(parseStringArray(org.modulesEnabled));
    if (enabled) modules.add(LONG_FORM_MODULE);
    else modules.delete(LONG_FORM_MODULE);

    await prisma.organization.update({
      where: { id: orgId },
      data: { modulesEnabled: stringifyArray([...modules]) },
    });

    await auditInternal(admin.user.id, {
      orgId,
      action: enabled ? "client.longform.enable" : "client.longform.disable",
      entityType: "organization",
      entityId: orgId,
      summary: `${enabled ? "Enabled" : "Disabled"} the long-form pilot for "${org.name}"`,
    });
    revalidatePath(`/admin/clients/${orgId}`);

    return okVoid(
      enabled
        ? "Long-form enabled. Capacity and pricing are agreed separately from the retainer."
        : "Long-form disabled.",
    );
  });
}

/**
 * Mark a workspace as a synthetic dry run, or promote it to a real client.
 *
 * Deliberately a separate deliberate act rather than a field on the client
 * form. Turning the marker OFF is the dangerous direction: it makes every
 * figure in that workspace eligible to appear in portfolio revenue and in
 * proof, so it demands an explicit decision with an audit line and a name
 * against it.
 */
export async function setSyntheticAction(
  orgId: string,
  synthetic: boolean,
): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("admin.clients.manage");

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, kind: true, name: true, synthetic: true },
    });
    if (!org || org.kind !== "client") return err("That workspace no longer exists.", "not_found");
    if (org.synthetic === synthetic) return okVoid("Already set.");

    await prisma.organization.update({ where: { id: orgId }, data: { synthetic } });

    await auditInternal(admin.user.id, {
      orgId,
      action: synthetic ? "client.synthetic.mark" : "client.synthetic.clear",
      entityType: "organization",
      entityId: orgId,
      summary: synthetic
        ? `Marked "${org.name}" as a synthetic dry run`
        : `Cleared the synthetic marker on "${org.name}" — its figures now count as real`,
    });

    revalidatePath(`/admin/clients/${orgId}`);
    revalidatePath("/admin");

    return okVoid(
      synthetic
        ? "Marked synthetic. Excluded from portfolio totals and refused as proof."
        : "Marker cleared. Everything in this workspace now counts as a real client result.",
    );
  });
}

const qualifySchema = z.object({
  ownerId: z.string().max(60).optional(),
  nextAction: z.string().max(300).optional(),
  nextActionDue: z.string().max(20).optional(),
  outcome: z.enum(["open", "won", "lost", "not_a_fit", "no_response"]).default("open"),
  outcomeReason: z.string().max(1000).optional(),
});

/** Qualification (COM-02): owner, next action with a due date, and the outcome with its reason. */
export async function qualifyApplicationAction(applicationId: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("admin.applications");
    const input = parseForm(qualifySchema, formData);
    const app = await prisma.application.findUnique({ where: { id: applicationId }, select: { id: true, company: true, orgId: true } });
    if (!app) return err("That application no longer exists.", "not_found");
    if (input.ownerId) {
      const staff = await prisma.membership.findFirst({ where: { userId: input.ownerId, role: { in: ["internal_operator", "super_admin"] }, org: { kind: "internal" } } });
      if (!staff) return err("The owner must be a member of the Threadline team.", "validation", { ownerId: "Not a staff member." });
    }
    if (input.outcome === "won" && !app.orgId) return err("Mark it won by converting it into a client.", "workflow");
    const due = input.nextActionDue ? new Date(`${input.nextActionDue}T09:00:00Z`) : null;
    if (due && Number.isNaN(due.getTime())) return err("Use a valid date.", "validation", { nextActionDue: "Invalid date." });
    await prisma.application.update({
      where: { id: app.id },
      data: {
        ownerId: input.ownerId || null,
        nextAction: input.nextAction ? cleanText(input.nextAction, 300) : null,
        nextActionDue: due,
        outcome: input.outcome === "open" ? null : input.outcome,
        outcomeReason: input.outcomeReason ? cleanText(input.outcomeReason, 1000) : null,
        ...(input.outcome === "lost" || input.outcome === "not_a_fit" ? { status: "declined" } : {}),
      },
    });
    await auditInternal(admin.user.id, { action: "application.qualify", entityType: "application", entityId: app.id, summary: `Qualified ${app.company}: ${input.outcome}${input.nextAction ? `; next: ${input.nextAction}` : ""}` });
    revalidatePath("/admin/applications");
    return okVoid("Saved.");
  });
}
