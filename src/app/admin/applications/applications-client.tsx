"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Pill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { DefinitionList } from "@/components/ui/data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import { ApplicationStatusBadge } from "@/components/ui/status";
import { toast } from "@/components/ui/toast";
import { updateApplicationStatusAction } from "@/lib/actions/admin";
import { createProspectFromApplicationAction } from "@/lib/actions/economics";
import { APPLICATION_STATUSES, APPLICATION_STATUS_META } from "@/lib/domain/enums";
import { relativeTime } from "@/lib/utils/dates";

type Application = {
  id: string;
  name: string;
  email: string;
  company: string;
  website: string | null;
  whatYouSell: string;
  revenueRange: string;
  contentProcess: string;
  peopleInvolved: string;
  publishCadence: string;
  biggestBottleneck: string;
  founderHours: string;
  platforms: string[];
  successLooksLike: string;
  urgency: string;
  extra: string | null;
  status: string;
  reviewNotes: string | null;
  createdAt: string;
};

export function ApplicationList({ applications }: { applications: Application[] }) {
  return (
    <ul className="space-y-3">
      {applications.map((application) => (
        <li key={application.id}>
          <ApplicationCard application={application} />
        </li>
      ))}
    </ul>
  );
}

function ApplicationCard({ application }: { application: Application }) {
  const router = useRouter();
  const [expanded, setExpanded] = React.useState(false);
  const [notes, setNotes] = React.useState(application.reviewNotes ?? "");
  const [pending, startTransition] = React.useTransition();

  const setStatus = (status: string) => {
    startTransition(async () => {
      const result = await updateApplicationStatusAction(application.id, status, notes);
      if (result.ok) {
        toast.success(result.message ?? "Application updated.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Card>
      <CardBody className="pt-4">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[14px] font-medium text-ink">{application.company}</p>
              <ApplicationStatusBadge status={application.status} />
            </div>
            <p className="mt-1 text-[12px] text-muted">
              {application.name} · {application.email}
              {application.website ? (
                <>
                  {" · "}
                  <a
                    href={application.website}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 text-accent transition-colors hover:text-accent-bright"
                  >
                    site
                    <ExternalLink className="size-3" aria-hidden />
                  </a>
                </>
              ) : null}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="text-[11.5px] text-ghost">
              {relativeTime(new Date(application.createdAt))}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="xs" variant="secondary" loading={pending}>
                  Set status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={() =>
                    startTransition(async () => {
                      const result = await createProspectFromApplicationAction(application.id);
                      if (result.ok) {
                        toast.success(result.message ?? "Prospect created.");
                        router.push(`/admin/prospects/${result.data.prospectId}`);
                      } else {
                        toast.error(result.error);
                      }
                    })
                  }
                >
                  Create prospect from this application
                </DropdownMenuItem>
                <DropdownMenuLabel>Move to</DropdownMenuLabel>
                {APPLICATION_STATUSES.filter((s) => s !== application.status).map((status) => (
                  <DropdownMenuItem key={status} onSelect={() => setStatus(status)}>
                    {APPLICATION_STATUS_META[status].label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
            >
              <ChevronDown
                className={cn("size-3.5 transition-transform", expanded && "rotate-180")}
                aria-hidden
              />
              <span className="sr-only">{expanded ? "Collapse" : "Expand"}</span>
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Pill>{application.revenueRange}</Pill>
          <Pill>{application.founderHours} founder time</Pill>
          <Pill>{application.publishCadence}</Pill>
          <Pill>{application.peopleInvolved} involved</Pill>
          {application.platforms.map((p) => (
            <Pill key={p}>{p}</Pill>
          ))}
        </div>

        <p className="mt-3 line-clamp-2 text-[12.5px] leading-relaxed text-muted">
          <span className="text-faint">Bottleneck: </span>
          {application.biggestBottleneck}
        </p>

        {expanded ? (
          <div className="mt-5 space-y-5 border-t border-line pt-5">
            <DefinitionList
              columns={1}
              items={[
                { label: "What they sell", value: application.whatYouSell },
                { label: "How content gets made today", value: application.contentProcess },
                { label: "Biggest bottleneck", value: application.biggestBottleneck },
                { label: "What success looks like", value: application.successLooksLike },
                { label: "Urgency", value: application.urgency },
                ...(application.extra
                  ? [{ label: "Additional context", value: application.extra }]
                  : []),
              ]}
            />

            <div>
              <p className="text-eyebrow mb-2 text-faint">Review notes</p>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Qualification decision and reasoning. Saved when you set a status."
              />
              <p className="mt-2 text-[11.5px] text-ghost">
                Notes are saved with the next status change.
              </p>
            </div>
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
