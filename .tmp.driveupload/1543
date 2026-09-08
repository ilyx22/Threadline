import type { Metadata } from "next";
import { requireOrgPage } from "@/lib/auth/guard";
import { listIntegrations, listSocialAccounts } from "@/lib/data/distribution";
import { INTEGRATIONS, accessOptionsFor } from "@/lib/integrations/registry";
import { parseRecord } from "@/lib/db/json";
import { Notice } from "@/components/ui/feedback";
import { IntegrationList, AccountManager } from "./integrations-client";

export const metadata: Metadata = { title: "Integrations" };

export default async function IntegrationsPage({ params }: { params: Promise<{ org: string }> }) {
  const { org: slug } = await params;
  const ctx = await requireOrgPage(slug, "workspace.view");

  const [stored, accounts] = await Promise.all([
    listIntegrations(ctx.org.id),
    listSocialAccounts(ctx.org.id),
  ]);

  const byProvider = new Map(stored.map((i) => [i.provider, i]));
  const canEdit = ctx.can("workspace.settings");

  const available = INTEGRATIONS.filter((i) => i.implementation === "available").length;

  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <h1 className="text-section">Integrations</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          What Threadline can and cannot connect to today, stated plainly. Where a connection is not
          possible, the manual workflow is described — and it is supported, not a placeholder.
        </p>
      </header>

      <Notice tone="neutral" title="Why so few are connected">
        Publishing and analytics APIs require credentials or platform approval that only the account
        owner can obtain — a verified Google Cloud project, an approved LinkedIn Marketing Developer
        application, a Meta app that has passed review. Threadline builds the adapter and the
        configuration surface, but it will not show a connection it does not have.{" "}
        <strong className="text-ink">{available} of {INTEGRATIONS.length}</strong> integrations work
        end to end in this version.
      </Notice>

      <IntegrationList
        slug={slug}
        canEdit={canEdit}
        integrations={INTEGRATIONS.map((definition) => {
          const record = byProvider.get(definition.provider);
          return {
            provider: definition.provider,
            name: definition.name,
            category: definition.category,
            summary: definition.summary,
            capabilities: [...definition.capabilities],
            implementation: definition.implementation,
            accessMethod: record?.accessMethod ?? "manual",
            accessOptions: accessOptionsFor(definition),
            blockedReason: definition.blockedReason ?? null,
            manualFallback: definition.manualFallback,
            configFields: (definition.configFields ?? []).map((f) => ({
              key: f.key,
              label: f.label,
              placeholder: f.placeholder ?? null,
              hint: f.hint ?? null,
              type: f.type ?? "text",
            })),
            status: record?.status ?? "not_configured",
            config: record ? parseRecord(record.config) : {},
            connectedAt: record?.connectedAt ? record.connectedAt.toISOString() : null,
            notes: record?.notes ?? null,
          };
        })}
      />

      <AccountManager
        slug={slug}
        canEdit={canEdit}
        accounts={accounts.map((a) => ({
          id: a.id,
          platform: a.platform,
          handle: a.handle,
          displayName: a.displayName,
          isConnected: a.isConnected,
          publishCount: a._count.publishRecords,
        }))}
      />
    </div>
  );
}
