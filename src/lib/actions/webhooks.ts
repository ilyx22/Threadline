"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { audit } from "@/lib/auth/audit";
import { requireOrgAccess } from "@/lib/auth/guard";
import { putCredential } from "@/lib/integrations/credentials";
import { credentialStorageConfigured } from "@/lib/security/secret-box";
import { WEBHOOK_PROVIDERS, type WebhookProvider } from "@/lib/integrations/webhooks";
import { err, guarded, okVoid, parseForm, type ActionResult } from "./shared";

/**
 * Staff-only entry of the credential that proves an inbound webhook came from
 * the client's own provider account (SEC-05). The value is sealed with the
 * credential keyring and never rendered back; the screen shows only whether
 * one is stored and when it was last set or used.
 */
const schema = z.object({ secret: z.string().trim().min(6, "Paste the full value.").max(500) });

function provider(p: string): WebhookProvider | null {
  return (WEBHOOK_PROVIDERS as readonly string[]).includes(p) ? (p as WebhookProvider) : null;
}

export async function saveWebhookCredentialAction(orgSlug: string, providerName: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "attribution.manage");
    const p = provider(providerName);
    if (!p) return err("Unknown provider.", "not_found");
    if (!credentialStorageConfigured()) return err("Credential encryption keys are not configured on this deployment, so nothing can be stored yet.", "workflow");
    const { secret } = parseForm(schema, formData);
    if (p === "pipedrive" && !/^[^:]+:.+$/.test(secret)) return err("Enter the basic-auth user and password as user:password.", "validation", { secret: "Use user:password." });
    await putCredential({ orgId: ctx.org.id, provider: p, purpose: "webhook_secret", secret });
    await audit(ctx, { action: "webhook.credential_set", entityType: "credential", entityId: p, summary: `Set the ${p} webhook credential` });
    revalidatePath(`/app/${orgSlug}/settings/integrations`);
    return okVoid("Stored. Deliveries from this provider are now verified.");
  });
}

export async function removeWebhookCredentialAction(orgSlug: string, providerName: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "attribution.manage");
    const p = provider(providerName);
    if (!p) return err("Unknown provider.", "not_found");
    await prisma.credential.deleteMany({ where: { orgId: ctx.org.id, provider: p, purpose: "webhook_secret" } });
    await audit(ctx, { action: "webhook.credential_removed", entityType: "credential", entityId: p, summary: `Removed the ${p} webhook credential; its deliveries will now be refused` });
    revalidatePath(`/app/${orgSlug}/settings/integrations`);
    return okVoid("Removed. Deliveries from this provider will be refused until a new value is stored.");
  });
}
