"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { audit, touchOrg } from "@/lib/auth/audit";
import { requireOrgAccess } from "@/lib/auth/guard";
import { parseRecord, stringify } from "@/lib/db/json";
import { platformSchema, publishStatusSchema } from "@/lib/domain/enums";
import { assertPublishTransition } from "@/lib/domain/workflow";
import { getAdapter } from "@/lib/integrations/adapter";
import { integrationByProvider } from "@/lib/integrations/registry";
import { cleanUrl, err, guarded, ok, okVoid, parseForm, type ActionResult } from "./shared";

/** Distribution mutations: publish records, accounts and integration configuration. */

function revalidateDistribution(orgSlug: string) {
  revalidatePath(`/app/${orgSlug}/distribution`);
  revalidatePath(`/app/${orgSlug}`);
}

const createRecordSchema = z.object({
  contentItemId: z.string().min(1),
  platform: platformSchema,
  accountId: z.string().optional(),
  scheduledFor: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : null)),
  packageId: z.string().optional(),
  distributionMode: z.enum(["organic", "paid_amplified"]).default("organic"),
});

export async function createPublishRecordAction(
  orgSlug: string,
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "distribution.edit");
    const input = parseForm(createRecordSchema, formData);

    const item = await prisma.contentItem.findFirst({
      where: { id: input.contentItemId, orgId: ctx.org.id },
      select: { id: true, title: true, stage: true },
    });
    if (!item) return err("That content item no longer exists.", "not_found");
    if (!["approved", "scheduled", "live"].includes(item.stage)) {
      return err("Only approved content can be scheduled for distribution.", "workflow");
    }

    // Verify any referenced account and package belong to this workspace.
    if (input.accountId) {
      const account = await prisma.socialAccount.findFirst({
        where: { id: input.accountId, orgId: ctx.org.id },
        select: { id: true },
      });
      if (!account) return err("That account is not in this workspace.", "validation");
    }
    if (input.packageId) {
      const pkg = await prisma.platformPackage.findFirst({
        where: { id: input.packageId, orgId: ctx.org.id },
        select: { id: true },
      });
      if (!pkg) return err("That package is not in this workspace.", "validation");
    }

    const record = await prisma.publishRecord.create({
      data: {
        orgId: ctx.org.id,
        contentItemId: item.id,
        platform: input.platform,
        accountId: input.accountId ?? null,
        packageId: input.packageId ?? null,
        scheduledFor: input.scheduledFor,
        status: input.scheduledFor ? "scheduled" : "draft",
        method: "manual",
        distributionMode: input.distributionMode,
      },
    });

    if (input.scheduledFor) {
      await prisma.contentItem.update({
        where: { id: item.id },
        data: { stage: item.stage === "approved" ? "scheduled" : item.stage },
      });
      await prisma.contentEvent.create({
        data: {
          orgId: ctx.org.id,
          contentItemId: item.id,
          type: "scheduled",
          fromStage: item.stage,
          toStage: "scheduled",
          note: `Scheduled for ${input.platform} on ${input.scheduledFor.toLocaleDateString("en-GB")}`,
          actorId: ctx.user.id,
        },
      });
    }

    await audit(ctx, {
      action: "publish.create",
      entityType: "publish_record",
      entityId: record.id,
      summary: `Created a ${input.platform} publish record for "${item.title}"`,
    });
    await touchOrg(ctx.org.id);
    revalidateDistribution(orgSlug);
    revalidatePath(`/app/${orgSlug}/production/${item.id}`);

    return ok({ id: record.id }, input.scheduledFor ? "Scheduled." : "Publish record created.");
  });
}

const updateRecordSchema = z.object({
  status: publishStatusSchema.optional(),
  scheduledFor: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : null)),
  url: z.string().max(600).optional(),
  failureReason: z.string().max(600).optional(),
});

export async function updatePublishRecordAction(
  orgSlug: string,
  recordId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "distribution.edit");
    const input = parseForm(updateRecordSchema, formData);

    const record = await prisma.publishRecord.findFirst({
      where: { id: recordId, orgId: ctx.org.id },
      include: { contentItem: { select: { id: true, title: true, stage: true } } },
    });
    if (!record) return err("That publish record no longer exists.", "not_found");

    const nextStatus = input.status ?? (record.status as never);
    const nextUrl = input.url !== undefined ? cleanUrl(input.url) : record.url;
    const nextScheduled = input.scheduledFor ?? record.scheduledFor;

    if (input.status && input.status !== record.status) {
      if (input.status === "published" && !ctx.can("distribution.publish")) {
        return err("Only a workspace admin can mark content published.", "auth");
      }
      // Throws WorkflowError for an illegal transition, a publish without a URL,
      // or a schedule without a date.
      assertPublishTransition(record.status as never, input.status, {
        url: nextUrl,
        scheduledFor: nextScheduled,
      });
    }

    await prisma.publishRecord.update({
      where: { id: recordId },
      data: {
        status: nextStatus,
        scheduledFor: nextScheduled,
        url: nextUrl,
        failureReason: input.failureReason ?? (nextStatus === "failed" ? record.failureReason : null),
        publishedAt: nextStatus === "published" ? (record.publishedAt ?? new Date()) : record.publishedAt,
      },
    });

    // Publishing the first record takes the content item live.
    if (nextStatus === "published" && record.contentItem.stage !== "live") {
      await prisma.contentItem.update({
        where: { id: record.contentItemId },
        data: { stage: "live", liveAt: new Date() },
      });
      await prisma.contentEvent.create({
        data: {
          orgId: ctx.org.id,
          contentItemId: record.contentItemId,
          type: "published",
          fromStage: record.contentItem.stage,
          toStage: "live",
          note: `Published to ${record.platform}`,
          actorId: ctx.user.id,
        },
      });
    }

    await audit(ctx, {
      action: "publish.update",
      entityType: "publish_record",
      entityId: recordId,
      summary: `Updated ${record.platform} publish record for "${record.contentItem.title}"`,
      meta: { from: record.status, to: nextStatus },
    });
    await touchOrg(ctx.org.id);
    revalidateDistribution(orgSlug);
    revalidatePath(`/app/${orgSlug}/production/${record.contentItemId}`);

    return okVoid(nextStatus === "published" ? "Marked live." : "Publish record updated.");
  });
}

export async function deletePublishRecordAction(
  orgSlug: string,
  recordId: string,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "distribution.edit");
    const record = await prisma.publishRecord.findFirst({
      where: { id: recordId, orgId: ctx.org.id },
      include: { _count: { select: { snapshots: true } } },
    });
    if (!record) return err("That publish record no longer exists.", "not_found");
    if (record.status === "published" && record._count.snapshots > 0) {
      return err(
        "This record has performance data attached. Deleting it would break attribution.",
        "workflow",
      );
    }

    await prisma.publishRecord.delete({ where: { id: recordId } });
    await audit(ctx, {
      action: "publish.delete",
      entityType: "publish_record",
      entityId: recordId,
      summary: `Deleted a ${record.platform} publish record`,
    });
    revalidateDistribution(orgSlug);

    return okVoid("Publish record removed.");
  });
}

/* --------------------------------- Accounts ---------------------------------- */

const accountSchema = z.object({
  platform: platformSchema,
  handle: z.string().min(1).max(120),
  displayName: z.string().max(200).optional(),
});

export async function createSocialAccountAction(
  orgSlug: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "workspace.settings");
    const input = parseForm(accountSchema, formData);

    await prisma.socialAccount.create({
      data: {
        orgId: ctx.org.id,
        platform: input.platform,
        handle: input.handle,
        displayName: input.displayName ?? null,
        // Honest by default: an account is a destination label, not a connection.
        isConnected: false,
      },
    });

    await audit(ctx, {
      action: "account.create",
      entityType: "social_account",
      summary: `Added ${input.platform} account ${input.handle}`,
    });
    revalidateDistribution(orgSlug);
    revalidatePath(`/app/${orgSlug}/settings/integrations`);

    return okVoid("Account added.");
  });
}

export async function deleteSocialAccountAction(
  orgSlug: string,
  accountId: string,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "workspace.settings");
    const account = await prisma.socialAccount.findFirst({
      where: { id: accountId, orgId: ctx.org.id },
      select: { id: true, handle: true },
    });
    if (!account) return err("That account no longer exists.", "not_found");

    await prisma.socialAccount.delete({ where: { id: accountId } });
    await audit(ctx, {
      action: "account.delete",
      entityType: "social_account",
      entityId: accountId,
      summary: `Removed account ${account.handle}`,
    });
    revalidatePath(`/app/${orgSlug}/settings/integrations`);

    return okVoid("Account removed.");
  });
}

/* ------------------------------- Integrations -------------------------------- */

/**
 * Save integration configuration.
 *
 * The adapter decides whether a connection is genuinely possible. Providers that
 * need credentials we cannot obtain save their (useful, non-secret) configuration
 * and report honestly that they are not connected — they never flip to
 * "Connected" on the strength of a saved URL.
 */
export async function saveIntegrationAction(
  orgSlug: string,
  provider: string,
  _prev: ActionResult<{ connected: boolean }> | null,
  formData: FormData,
): Promise<ActionResult<{ connected: boolean }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "workspace.settings");

    const definition = integrationByProvider(provider);
    if (!definition) return err("Unknown integration.", "not_found");

    const config: Record<string, unknown> = {};
    for (const field of definition.configFields ?? []) {
      const value = formData.get(field.key);
      if (typeof value === "string" && value.trim()) config[field.key] = value.trim();
    }

    const adapter = getAdapter(provider);
    const validation = adapter.validateConfig(config);
    if (!validation.ok) {
      return err(validation.errors.join(" "), "validation");
    }

    const connection = await adapter.connect(config);
    const connected = connection.ok;

    await prisma.integration.upsert({
      where: { orgId_provider: { orgId: ctx.org.id, provider } },
      create: {
        orgId: ctx.org.id,
        provider,
        config: stringify(config),
        status: connected ? "configured" : "not_configured",
        connectedAt: connected ? new Date() : null,
        notes: connected ? null : connection.ok ? null : connection.message,
      },
      update: {
        config: stringify(config),
        status: connected ? "configured" : "not_configured",
        connectedAt: connected ? new Date() : null,
        notes: connected ? null : connection.ok ? null : connection.message,
      },
    });

    await audit(ctx, {
      action: "integration.save",
      entityType: "integration",
      summary: `Saved ${definition.name} configuration`,
      meta: { provider, connected },
    });
    revalidatePath(`/app/${orgSlug}/settings/integrations`);
    revalidateDistribution(orgSlug);

    return ok(
      { connected },
      connected
        ? `${definition.name} configured.`
        : `Configuration saved. ${definition.name} cannot complete a connection yet — the manual workflow is available.`,
    );
  });
}

export async function disableIntegrationAction(
  orgSlug: string,
  provider: string,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "workspace.settings");
    const existing = await prisma.integration.findUnique({
      where: { orgId_provider: { orgId: ctx.org.id, provider } },
    });
    if (!existing) return err("That integration is not configured.", "not_found");

    await prisma.integration.update({
      where: { orgId_provider: { orgId: ctx.org.id, provider } },
      data: { status: "disabled", connectedAt: null },
    });

    await audit(ctx, {
      action: "integration.disable",
      entityType: "integration",
      summary: `Disabled ${provider}`,
    });
    revalidatePath(`/app/${orgSlug}/settings/integrations`);

    return okVoid("Integration disabled.");
  });
}

/** Read the configured booking URL, used by the application flow. */
export async function getBookingUrl(orgId: string): Promise<string | null> {
  const integration = await prisma.integration.findUnique({
    where: { orgId_provider: { orgId, provider: "booking" } },
  });
  if (!integration || integration.status !== "configured") return null;
  const config = parseRecord(integration.config);
  return typeof config.url === "string" ? config.url : null;
}
