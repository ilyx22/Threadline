import type { Metadata } from "next";
import Link from "next/link";
import { Route } from "lucide-react";
import { requireInternal } from "@/lib/auth/guard";
import { listProspects, listWedges } from "@/lib/data/acquisition";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import {
  PROSPECT_STATES,
  PROSPECT_STATE_META,
  PROSPECT_TIER_META,
  metaOf,
} from "@/lib/domain/enums";
import { relativeTime } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import { AddProspectButton } from "./prospects-client";

export const metadata: Metadata = { title: "Prospects" };

/**
 * Every prospect, ordered by what is due rather than by when it was added.
 *
 * The list is not a pipeline board on purpose. A board invites moving cards
 * around; this invites doing the thing that is due, which is the behaviour the
 * whole engine exists to produce.
 */
export default async function ProspectsPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; tier?: string }>;
}) {
  await requireInternal("acquisition.view");
  const params = await searchParams;

  const [prospects, wedges] = await Promise.all([
    listProspects({ state: params.state, tier: params.tier }),
    listWedges(),
  ]);

  const counts = new Map<string, number>();
  for (const p of await listProspects()) {
    counts.set(p.state, (counts.get(p.state) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-section">Prospects</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            Threadline&apos;s own pipeline. Each record carries the state it is in, the checklist
            that state requires, and the dated thing that happens next.
          </p>
        </div>
        <AddProspectButton wedges={wedges.map((w) => ({ id: w.id, label: w.label }))} />
      </header>

      <nav className="flex flex-wrap items-center gap-1.5">
        <FilterChip href="/admin/prospects" active={!params.state} label="All" />
        {PROSPECT_STATES.filter((s) => (counts.get(s) ?? 0) > 0).map((state) => (
          <FilterChip
            key={state}
            href={`/admin/prospects?state=${state}`}
            active={params.state === state}
            label={`${metaOf(PROSPECT_STATE_META, state).label} ${counts.get(state) ?? 0}`}
          />
        ))}
      </nav>

      {prospects.length === 0 ? (
        <EmptyState
          icon={Route}
          title={params.state ? "Nothing in this state" : "No prospects yet"}
          description={
            params.state
              ? "Try another state, or clear the filter."
              : "Acquisition is an operating activity rather than a feature. This list fills up by doing it."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-elevated">
          <Table>
            <THead>
              <TR>
                <TH>Company</TH>
                <TH>State</TH>
                <TH>Tier</TH>
                <TH>Next action</TH>
                <TH className="text-right">Due</TH>
              </TR>
            </THead>
            <TBody>
              {prospects.map((p) => {
                const state = metaOf(PROSPECT_STATE_META, p.state);
                const tier = metaOf(PROSPECT_TIER_META, p.tier);
                return (
                  <TR key={p.id}>
                    <TD>
                      <Link
                        href={`/admin/prospects/${p.id}`}
                        className="block min-w-0 hover:underline"
                      >
                        <span className="block truncate text-[13px] font-medium text-ink">
                          {p.company}
                        </span>
                        {p.contactName ? (
                          <span className="block truncate text-[11.5px] text-faint">
                            {p.contactName}
                            {p.contactRole ? ` · ${p.contactRole}` : ""}
                          </span>
                        ) : null}
                      </Link>
                    </TD>
                    <TD>
                      <Badge tone={state.tone}>{state.label}</Badge>
                    </TD>
                    <TD>
                      <Badge tone={tier.tone}>{tier.label}</Badge>
                    </TD>
                    <TD className="max-w-[280px]">
                      <span className="block truncate text-[12.5px] text-muted">
                        {p.nextAction ?? "None recorded"}
                      </span>
                    </TD>
                    <TD className="text-right">
                      {p.nextActionDueAt ? (
                        <span
                          className={cn(
                            "text-[12px]",
                            p.overdue ? "text-negative" : "text-faint",
                          )}
                        >
                          {relativeTime(p.nextActionDueAt)}
                        </span>
                      ) : p.active ? (
                        // Only an active record is missing something here. A
                        // closed one correctly has no next action, and flagging
                        // it would teach the operator to ignore the warning.
                        <span className="text-[12px] text-warning">No date</span>
                      ) : (
                        <span className="text-[12px] text-ghost">Closed</span>
                      )}
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-2.5 py-1 text-[12px] transition-colors",
        active
          ? "border-accent-line bg-accent-soft text-accent"
          : "border-line text-faint hover:text-muted",
      )}
    >
      {label}
    </Link>
  );
}
