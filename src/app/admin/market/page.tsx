import type { Metadata } from "next";
import Link from "next/link";
import { Telescope } from "lucide-react";
import { requireInternal } from "@/lib/auth/guard";
import { listWedges } from "@/lib/data/acquisition";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { WEDGE_STATE_META, metaOf } from "@/lib/domain/enums";
import { VALIDATION_DECISION_MINIMUM } from "@/lib/domain/sop";
import { relativeTime } from "@/lib/utils/dates";
import { ActivateWedgeButton, AddWedgeButton } from "./market-client";

export const metadata: Metadata = { title: "Market" };

/**
 * Market validation.
 *
 * The step that decides whether there is a business here, and the one most
 * easily skipped because it produces no artefact until it is finished. Holding
 * it as state — with the interview sample as a gate rather than a suggestion —
 * is what stops uncertainty being resolved by building software instead.
 */
export default async function MarketPage() {
  await requireInternal("acquisition.view");
  const wedges = await listWedges();
  const active = wedges.find((w) => w.active);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-section">Market</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            &ldquo;Expert-led B2B&rdquo; is the umbrella category, not a validated niche. One wedge
            and one expensive problem at a time, chosen on evidence and frozen before the first
            controlled sales sample.
          </p>
        </div>
        <AddWedgeButton />
      </header>

      {!active && wedges.length > 0 ? (
        <Notice tone="warning" title="No active wedge">
          Scored candidates without a chosen one is where validation stalls. Pick the one to immerse
          in first.
        </Notice>
      ) : null}

      {wedges.length === 0 ? (
        <EmptyState
          icon={Telescope}
          title="No candidate wedges"
          description="Start with two or three plausible segments, scored on economics, pain, reachability and whether businesses like them already buy comparable services."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {wedges.map((wedge) => {
            const state = metaOf(WEDGE_STATE_META, wedge.state);
            const score =
              wedge.scoreEconomics + wedge.scorePain + wedge.scoreReach + wedge.scorePrecedent;

            return (
              <Card key={wedge.id} accent={wedge.active} className="flex flex-col">
                <CardBody className="flex flex-1 flex-col gap-3 pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/admin/market/${wedge.id}`} className="min-w-0 hover:underline">
                      <p className="text-[14px] font-medium leading-snug text-ink">{wedge.label}</p>
                    </Link>
                    {wedge.active ? <Badge tone="accent">Active</Badge> : null}
                  </div>

                  {wedge.summary ? (
                    <p className="line-clamp-3 text-[12.5px] leading-relaxed text-muted">
                      {wedge.summary}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={state.tone}>{state.label}</Badge>
                    <span className="text-[11.5px] text-faint">
                      {wedge._count.conversations} of {VALIDATION_DECISION_MINIMUM} conversations
                    </span>
                    {score > 0 ? (
                      <span className="text-[11.5px] text-faint">score {score}/20</span>
                    ) : null}
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                    <span className="text-[11.5px] text-faint">
                      {wedge.nextActionDueAt
                        ? `Next ${relativeTime(wedge.nextActionDueAt)}`
                        : "No date set"}
                    </span>
                    {!wedge.active ? (
                      <ActivateWedgeButton wedgeId={wedge.id} label={wedge.label} />
                    ) : null}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
