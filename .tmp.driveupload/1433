import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Building2, ExternalLink } from "lucide-react";
import { requireInternal } from "@/lib/auth/guard";
import { listClients } from "@/lib/data/admin";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR, CellTitle } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/feedback";
import { OrgStatusBadge } from "@/components/ui/status";
import { PACKAGE_TIER_META, metaOf } from "@/lib/domain/enums";
import { money } from "@/lib/utils/format";
import { relativeTime } from "@/lib/utils/dates";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage() {
  await requireInternal("admin.clients.manage");
  const clients = await listClients();

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-section">Clients</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            Every workspace, its health and what it needs. Health is computed from overdue
            approvals, missing recordings, output against target and time since last activity.
          </p>
        </div>
        <ButtonLink href="/admin/clients/new" variant="accent" icon={Building2}>
          New client
        </ButtonLink>
      </header>

      {clients.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No clients yet"
          description="Create the first client workspace from the master template."
          action={
            <ButtonLink href="/admin/clients/new" variant="primary">
              Create a client
            </ButtonLink>
          }
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Client</TH>
              <TH>Status</TH>
              <TH>Package</TH>
              <TH align="right">Health</TH>
              <TH align="right">Per period</TH>
              <TH align="right">Output 30d</TH>
              <TH>Last activity</TH>
              <TH>Alerts</TH>
              <TH align="right"></TH>
            </TR>
          </THead>
          <TBody>
            {clients.map((client) => (
              <TR key={client.id} interactive>
                <TD>
                  <Link href={`/admin/clients/${client.id}`}>
                    <CellTitle secondary={`/${client.slug} · ${client._count.memberships} members`}>
                      {client.name}
                    </CellTitle>
                  </Link>
                </TD>
                <TD>
                  <OrgStatusBadge status={client.status} />
                </TD>
                <TD>{metaOf(PACKAGE_TIER_META, client.packageTier).label}</TD>
                <TD align="right">
                  <Badge tone={client.healthBand.tone}>{client.health}</Badge>
                </TD>
                <TD align="right" className="tabular">
                  {money(client.periodFee, client.currency, { compact: true })}
                </TD>
                <TD align="right" className="tabular">
                  <span className={client.publishedLast30 < client.target ? "text-warning" : undefined}>
                    {client.publishedLast30}
                  </span>
                  <span className="text-ghost"> / {client.target}</span>
                </TD>
                <TD>
                  {client.lastActivityAt ? relativeTime(client.lastActivityAt) : "Never"}
                </TD>
                <TD>
                  {client.alerts.length === 0 ? (
                    <span className="text-ghost">—</span>
                  ) : (
                    <span
                      className={
                        client.alerts.some((a) => a.severity === "critical")
                          ? "inline-flex items-center gap-1.5 text-negative"
                          : "inline-flex items-center gap-1.5 text-warning"
                      }
                      title={client.alerts.map((a) => a.message).join(" · ")}
                    >
                      <AlertTriangle className="size-3.5" aria-hidden />
                      {client.alerts.length}
                    </span>
                  )}
                </TD>
                <TD align="right">
                  <Link
                    href={`/app/${client.slug}`}
                    className="inline-flex items-center gap-1 text-[12px] text-accent transition-colors hover:text-accent-bright"
                  >
                    Open
                    <ExternalLink className="size-3" aria-hidden />
                  </Link>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
