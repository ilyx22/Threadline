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
import { convertApplicationAction, qualifyApplicationAction, updateApplicationStatusAction } from "@/lib/actions/admin";
import { ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect } from "@/components/ui/input";
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
  ownerId: string | null;
  nextAction: string | null;
  nextActionDue: string | null;
  outcome: string | null;
  outcomeReason: string | null;
  clientSlug: string | null;
};

type Staff = { id: string; name: string };

export function ApplicationList({ applications, staff, openId }: { applications: Application[]; staff: Staff[]; openId?: string | null }) {
  return (
    <ul className="space-y-3">
      {applications.map((application) => (
        <li key={application.id}>
          <ApplicationCard application={application} staff={staff} startOpen={application.id === openId} />
        </li>
      ))}
    </ul>
  );
}

function ApplicationCard({ application, staff, startOpen = false }: { application: Application; staff: Staff[]; startOpen?: boolean }) {
  const router = useRouter();
  const [expanded, setExpanded] = React.useState(startOpen);
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
              {application.clientSlug ? (
                <a href={`/app/${application.clientSlug}`} className="text-[12px] text-accent hover:text-accent-bright">Client workspace</a>
              ) : null}
            </div>
            {application.nextAction ? (
              <p className="mt-1 text-[12px] text-ink">
                Next: {application.nextAction}
                {application.nextActionDue ? <span className="text-ghost"> · due {application.nextActionDue}</span> : null}
                {application.ownerId ? <span className="text-ghost"> · {staff.find((s) => s.id === application.ownerId)?.name ?? "owner"}</span> : null}
              </p>
            ) : null}
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

            <QualifyForm application={application} staff={staff} />
            {!application.clientSlug ? <ConvertForm application={application} /> : null}
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}

function QualifyForm({ application, staff }: { application: Application; staff: Staff[] }) {
  const router = useRouter();
  return (
    <ActionForm action={qualifyApplicationAction.bind(null, application.id)} onSuccess={() => router.refresh()} className="space-y-3">
      {({ error, fieldErrors }) => (
        <>
          <p className="text-eyebrow text-faint">Qualification</p>
          <FormError error={error} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Owner" htmlFor={`owner-${application.id}`} error={fieldErrors.ownerId}>
              <NativeSelect id={`owner-${application.id}`} name="ownerId" defaultValue={application.ownerId ?? ""}>
                <option value="">Unassigned</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Outcome" htmlFor={`outcome-${application.id}`}>
              <NativeSelect id={`outcome-${application.id}`} name="outcome" defaultValue={application.outcome ?? "open"}>
                <option value="open">Open</option>
                <option value="won" disabled={!application.clientSlug}>
                  Won (convert first)
                </option>
                <option value="lost">Lost</option>
                <option value="not_a_fit">Not a fit</option>
                <option value="no_response">No response</option>
              </NativeSelect>
            </Field>
            <Field label="Next action" htmlFor={`next-${application.id}`}>
              <Input id={`next-${application.id}`} name="nextAction" defaultValue={application.nextAction ?? ""} placeholder="Book the fit call" />
            </Field>
            <Field label="Due" htmlFor={`due-${application.id}`} error={fieldErrors.nextActionDue}>
              <Input id={`due-${application.id}`} name="nextActionDue" type="date" defaultValue={application.nextActionDue ?? ""} />
            </Field>
            <Field label="Reason for the outcome" htmlFor={`reason-${application.id}`} className="sm:col-span-2" optional>
              <Input id={`reason-${application.id}`} name="outcomeReason" defaultValue={application.outcomeReason ?? ""} />
            </Field>
          </div>
          <SubmitButton size="sm" variant="secondary">
            Save qualification
          </SubmitButton>
        </>
      )}
    </ActionForm>
  );
}

function ConvertForm({ application }: { application: Application }) {
  const [link, setLink] = React.useState<string | null>(null);
  const [slug, setSlug] = React.useState<string | null>(null);
  const router = useRouter();
  const suggested = application.company.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  if (slug) {
    return (
      <div className="space-y-2 rounded-lg border border-line p-4">
        <p className="text-[13px] text-ink">Converted. {link ? "Email is not configured here; send the founder this invitation link:" : "The founder has been invited."}</p>
        {link ? <code className="block break-all rounded-md border border-line px-3 py-2 text-[12px] text-ink">{link}</code> : null}
        <a href={`/app/${slug}`} className="text-[13px] text-accent">
          Open the workspace
        </a>
      </div>
    );
  }
  return (
    <ActionForm
      action={convertApplicationAction}
      onSuccess={(d: unknown) => {
        const r = d as { slug: string; inviteLink: string | null };
        setLink(r.inviteLink);
        setSlug(r.slug);
        router.refresh();
      }}
      className="space-y-3 rounded-lg border border-line p-4"
    >
      {({ error, fieldErrors }) => (
        <>
          <p className="text-eyebrow text-faint">Convert into a client</p>
          <p className="text-[12px] text-muted">
            Creates the workspace and a draft engagement on the standard offer (£2,500 setup, £2,500 per 28-day period, three periods), invites the founder, and records the won deal in the CRM.
          </p>
          <FormError error={error} />
          <input type="hidden" name="applicationId" value={application.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Workspace name" htmlFor={`cname-${application.id}`}>
              <Input id={`cname-${application.id}`} name="name" defaultValue={application.company} required />
            </Field>
            <Field label="Workspace address" htmlFor={`cslug-${application.id}`} error={fieldErrors.slug}>
              <Input id={`cslug-${application.id}`} name="slug" defaultValue={suggested} required />
            </Field>
          </div>
          <SubmitButton size="sm" variant="primary">
            Convert and invite the founder
          </SubmitButton>
        </>
      )}
    </ActionForm>
  );
}
