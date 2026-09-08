"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  Download,
  ExternalLink,
  Plus,
  Sparkles,
  Telescope,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Slider } from "@/components/ui/controls";
import { Notice } from "@/components/ui/feedback";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { ActionForm, ActionButton, FormError, SubmitButton } from "@/components/forms/action-form";
import { toast } from "@/components/ui/toast";
import type { Tone } from "@/lib/domain/enums";
import {
  CANDIDATE_KIND_OPTIONS,
  RUN_SOURCE_KIND_META,
  RUN_SOURCE_KIND_OPTIONS,
  RUN_STATUS_META,
  type RunSourceKind,
  type RunStatus,
} from "@/lib/domain/enums";
import {
  addRunSourceAction,
  advanceRunAction,
  collectSourceAction,
  createRunAction,
  createTestFromSignalAction,
  decideCandidateAction,
  draftBriefSummaryAction,
  markSourceUnavailableAction,
  removeRunSourceAction,
  synthesiseRunAction,
  updateCandidateAction,
  updateRunAction,
} from "@/lib/actions/runs";

/**
 * Client controls for the intelligence run.
 *
 * These deliberately do not hide the fact that a person is in the loop: the
 * approve and reject controls sit next to the evidence, rejection requires a
 * reason, and nothing offers a "publish anyway" shortcut past an undecided
 * candidate — the server refuses it and the UI does not pretend otherwise.
 */

/* --------------------------------- New run --------------------------------- */

export function NewRunButton({ slug, disabled }: { slug: string; disabled?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 86_400_000);

  return (
    <>
      <Button
        icon={Plus}
        variant="accent"
        disabled={disabled}
        onClick={() => setOpen(true)}
        title={disabled ? "Finish the open cycle first" : undefined}
      >
        Start a cycle
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="lg">
          <DialogHeader
            title="Start an intelligence cycle"
            description="A cycle reads declared sources, proposes signals with evidence, and turns the ones you approve into ranked tests."
          />
          <ActionForm<{ id: string }>
            action={createRunAction.bind(null, slug)}
            onSuccess={(data) => {
              setOpen(false);
              router.push(`/app/${slug}/intelligence/runs/${data.id}`);
            }}
          >
            {({ fieldErrors, error }) => (
              <>
                <DialogBody className="space-y-4">
                  <FormError error={error} />
                  <Field label="Label" error={fieldErrors.label}>
                    <Input
                      name="label"
                      required
                      defaultValue={`Market read — week of ${weekAgo.toISOString().slice(0, 10)}`}
                    />
                  </Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Period start" error={fieldErrors.periodStart}>
                      <Input
                        type="date"
                        name="periodStart"
                        defaultValue={weekAgo.toISOString().slice(0, 10)}
                      />
                    </Field>
                    <Field label="Period end" error={fieldErrors.periodEnd}>
                      <Input
                        type="date"
                        name="periodEnd"
                        defaultValue={today.toISOString().slice(0, 10)}
                      />
                    </Field>
                  </div>
                  <Field
                    label="Focus"
                    optional
                    hint="What should this cycle try to answer? A focused run beats a broad sweep."
                    error={fieldErrors.focus}
                  >
                    <Textarea
                      name="focus"
                      rows={3}
                      placeholder="Why are qualified conversations stalling before the pricing discussion?"
                    />
                  </Field>
                </DialogBody>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <SubmitButton variant="accent">Start cycle</SubmitButton>
                </DialogFooter>
              </>
            )}
          </ActionForm>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ------------------------------- Advance run ------------------------------- */

export function AdvanceRunButton({
  slug,
  runId,
  target,
  variant = "secondary",
}: {
  slug: string;
  runId: string;
  target: RunStatus;
  variant?: "secondary" | "accent" | "ghost";
}) {
  const router = useRouter();
  const meta = RUN_STATUS_META[target];
  const label =
    target === "published"
      ? "Publish brief"
      : target === "archived"
        ? "Archive"
        : `Move to ${meta.label.toLowerCase()}`;

  return (
    <ActionButton
      variant={target === "published" ? "accent" : variant}
      action={() => advanceRunAction(slug, runId, target)}
      confirm={
        target === "published"
          ? "Publishing freezes this brief and makes it visible to the client. Continue?"
          : target === "archived"
            ? "Archive this cycle? It stops here and nothing is published."
            : undefined
      }
      onDone={() => router.refresh()}
    >
      {label}
    </ActionButton>
  );
}

/* --------------------------------- Sources --------------------------------- */

export function NewSourceButton({
  slug,
  runId,
  competitors,
}: {
  slug: string;
  runId: string;
  competitors: { id: string; name: string }[];
}) {
  const [open, setOpen] = React.useState(false);
  const [kind, setKind] = React.useState<RunSourceKind>("competitor");
  const router = useRouter();

  const guidance = RUN_SOURCE_KIND_META[kind]?.description ?? "";

  return (
    <>
      <Button icon={Plus} variant="secondary" onClick={() => setOpen(true)}>
        Add source
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="lg">
          <DialogHeader
            title="Add a source"
            description="Declare what this cycle reads. Nothing is collected in the background — public pages are fetched from a URL you supply, and everything else is pasted in or read from this workspace."
          />
          <ActionForm
            action={addRunSourceAction.bind(null, slug, runId)}
            onSuccess={() => {
              setOpen(false);
              router.refresh();
            }}
          >
            {({ fieldErrors, error }) => (
              <>
                <DialogBody className="space-y-4">
                  <FormError error={error} />
                  <Field label="Kind" error={fieldErrors.kind}>
                    <NativeSelect
                      name="kind"
                      value={kind}
                      onChange={(e) => setKind(e.target.value as RunSourceKind)}
                    >
                      {RUN_SOURCE_KIND_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                  {guidance ? (
                    <p className="text-[12px] leading-relaxed text-muted">{guidance}</p>
                  ) : null}

                  <Field label="Label" error={fieldErrors.label}>
                    <Input name="label" required placeholder="What is this source?" />
                  </Field>

                  {kind === "competitor" && competitors.length > 0 ? (
                    <Field label="Competitor" optional error={fieldErrors.competitorId}>
                      <NativeSelect name="competitorId" defaultValue="">
                        <option value="">Not one on the radar</option>
                        {competitors.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                  ) : null}

                  <Field label="URL" optional error={fieldErrors.url}>
                    <Input name="url" type="url" placeholder="https://" />
                  </Field>

                  <Field
                    label="Content"
                    optional
                    hint="Paste call notes, quotes or copy. Blank lines separate items, so each block becomes its own piece of evidence."
                    error={fieldErrors.content}
                  >
                    <Textarea name="content" rows={6} />
                  </Field>
                </DialogBody>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <SubmitButton variant="accent">Add source</SubmitButton>
                </DialogFooter>
              </>
            )}
          </ActionForm>
        </DialogContent>
      </Dialog>
    </>
  );
}

export type SourceView = {
  id: string;
  kind: string;
  label: string;
  url: string | null;
  status: string;
  statusNote: string | null;
  content: string | null;
  itemsCollected: number;
  collectedAt: string | null;
  competitorName: string | null;
  kindLabel: string;
  statusLabel: string;
  statusTone: Tone;
  modeLabel: string;
  guidance: string;
  internal: boolean;
};

export function SourceRow({
  slug,
  source,
  canManage,
}: {
  slug: string;
  source: SourceView;
  canManage: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [blocking, setBlocking] = React.useState(false);
  const router = useRouter();

  return (
    <li>
      <Card className="p-0">
        <CardBody className="pt-3.5">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={source.statusTone}>{source.statusLabel}</Badge>
                <span className="text-[11.5px] text-ghost">{source.kindLabel}</span>
                <span className="text-[11.5px] text-ghost">· {source.modeLabel}</span>
              </div>
              <p className="mt-1.5 text-[13.5px] font-medium leading-snug text-ink">
                {source.label}
                {source.competitorName ? (
                  <span className="text-ghost"> · {source.competitorName}</span>
                ) : null}
              </p>
              {source.url ? (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-1 inline-flex items-center gap-1 text-[11.5px] text-muted hover:text-accent"
                >
                  {source.url.slice(0, 80)}
                  <ExternalLink className="size-3" aria-hidden />
                </a>
              ) : null}
              {source.statusNote ? (
                <p className="mt-1.5 text-[12px] leading-relaxed text-warning">
                  {source.statusNote}
                </p>
              ) : null}
              {source.status === "collected" ? (
                <p className="mt-1 text-[11.5px] text-ghost">
                  {source.itemsCollected} item{source.itemsCollected === 1 ? "" : "s"}
                  {source.collectedAt
                    ? ` · ${new Date(source.collectedAt).toLocaleDateString("en-GB")}`
                    : ""}
                </p>
              ) : null}
            </div>

            {canManage ? (
              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  size="sm"
                  variant="secondary"
                  icon={Download}
                  onClick={() => setOpen(true)}
                >
                  {source.status === "collected" ? "Collect again" : "Collect"}
                </Button>
                {source.status === "pending" ? (
                  <Button size="sm" variant="ghost" onClick={() => setBlocking(true)}>
                    Cannot collect
                  </Button>
                ) : null}
                <ActionButton
                  size="sm"
                  variant="ghost"
                  icon={Trash2}
                  aria-label="Remove source"
                  confirm={`Remove "${source.label}"? Anything already collected from it is kept.`}
                  action={() => removeRunSourceAction(slug, source.id)}
                  onDone={() => router.refresh()}
                >
                  {""}
                </ActionButton>
              </div>
            ) : null}
          </div>
        </CardBody>
      </Card>

      <CollectDialog
        slug={slug}
        source={source}
        open={open}
        onOpenChange={setOpen}
        onDone={() => router.refresh()}
      />
      <UnavailableDialog
        slug={slug}
        source={source}
        open={blocking}
        onOpenChange={setBlocking}
        onDone={() => router.refresh()}
      />
    </li>
  );
}

function CollectDialog({
  slug,
  source,
  open,
  onOpenChange,
  onDone,
}: {
  slug: string;
  source: SourceView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader title={`Collect: ${source.label}`} description={source.guidance} />
        <ActionForm
          action={collectSourceAction.bind(null, slug, source.id)}
          onSuccess={() => {
            onOpenChange(false);
            onDone();
          }}
        >
          {({ fieldErrors, error }) => (
            <>
              <DialogBody className="space-y-4">
                <FormError error={error} />

                {source.internal ? (
                  <Notice tone="info" title="Read from this workspace">
                    This source needs no credentials — the records are already yours. Collecting
                    reads them for the period this cycle covers.
                  </Notice>
                ) : (
                  <>
                    <Field
                      label="URL to read"
                      optional
                      hint="Left blank, the source URL is used. Fetching is blocked on platforms that serve a login wall — paste the content instead."
                      error={fieldErrors.url}
                    >
                      <Input name="url" type="url" defaultValue={source.url ?? ""} />
                    </Field>
                    <Field
                      label="Or paste the content"
                      optional
                      hint="Blank lines separate items. Pasted content always wins over fetching."
                      error={fieldErrors.content}
                    >
                      <Textarea name="content" rows={10} defaultValue={source.content ?? ""} />
                    </Field>
                  </>
                )}
              </DialogBody>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <SubmitButton variant="accent" pendingLabel="Reading…">
                  Collect
                </SubmitButton>
              </DialogFooter>
            </>
          )}
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}

function UnavailableDialog({
  slug,
  source,
  open,
  onOpenChange,
  onDone,
}: {
  slug: string;
  source: SourceView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const [reason, setReason] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  const submit = () => {
    startTransition(async () => {
      const result = await markSourceUnavailableAction(slug, source.id, reason);
      if (result.ok) {
        toast.success(result.message ?? "Recorded.");
        onOpenChange(false);
        onDone();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader
          title="Record why it could not be collected"
          description="This appears in the published brief, so the client can see exactly what was and was not read."
        />
        <DialogBody>
          <Field label="Reason">
            <Textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="The platform requires an approved app we do not have, and the founder could not export the thread this week."
            />
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="accent" loading={pending} onClick={submit}>
            Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------- Synthesis -------------------------------- */

export function SynthesiseButton({
  slug,
  runId,
  count,
}: {
  slug: string;
  runId: string;
  count: number;
}) {
  const router = useRouter();
  return (
    <ActionButton
      variant="secondary"
      icon={Sparkles}
      action={() => synthesiseRunAction(slug, runId)}
      onDone={() => router.refresh()}
    >
      Extract signals from {count} item{count === 1 ? "" : "s"}
    </ActionButton>
  );
}

/* -------------------------------- Candidates ------------------------------- */

export type CandidateView = {
  id: string;
  kind: string;
  kindLabel: string;
  kindTone: Tone;
  title: string;
  rationale: string | null;
  soWhat: string | null;
  confidence: number;
  decision: string;
  decisionNote: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
  editedByHuman: boolean;
  generatedBy: string;
  patternId: string | null;
  evidence: {
    id: string;
    title: string;
    url: string | null;
    sourceName: string | null;
    kind: string;
    capturedAt: string;
    excerpt: string;
  }[];
};

export function CandidateCard({
  slug,
  candidate,
  canDecide,
}: {
  slug: string;
  candidate: CandidateView;
  canDecide: boolean;
}) {
  const [showEvidence, setShowEvidence] = React.useState(false);
  const [rejecting, setRejecting] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const router = useRouter();

  const pending = candidate.decision === "pending";

  return (
    <Card className="p-0">
      <CardBody className="pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={candidate.kindTone}>{candidate.kindLabel}</Badge>
          <span className="text-[11.5px] text-ghost">Confidence {candidate.confidence}%</span>
          <span className="text-[11.5px] text-ghost">
            · {candidate.evidence.length} evidence item
            {candidate.evidence.length === 1 ? "" : "s"}
          </span>
          {candidate.editedByHuman ? (
            <Badge tone="outline">Edited by a person</Badge>
          ) : candidate.generatedBy === "ai" ? (
            <Badge tone="outline">Proposed</Badge>
          ) : null}
        </div>

        <p className="mt-2.5 text-[14.5px] font-medium leading-snug text-ink">{candidate.title}</p>
        {candidate.rationale ? (
          <p className="mt-2 text-[13px] leading-relaxed text-muted">{candidate.rationale}</p>
        ) : null}
        {candidate.soWhat ? (
          <p className="mt-2.5 border-l-2 border-accent-line pl-3 text-[13px] leading-relaxed text-faint">
            <span className="text-accent">Why it matters: </span>
            {candidate.soWhat}
          </p>
        ) : null}

        {candidate.decision !== "pending" ? (
          <p className="mt-3 text-[12px] leading-relaxed text-ghost">
            {candidate.decision === "approved" ? "Approved" : "Rejected"}
            {candidate.decidedBy ? ` by ${candidate.decidedBy}` : ""}
            {candidate.decidedAt ? ` ${candidate.decidedAt}` : ""}
            {candidate.decisionNote ? ` — ${candidate.decisionNote}` : ""}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => setShowEvidence((v) => !v)}
          className="mt-3 inline-flex items-center gap-1 text-[12px] text-muted hover:text-ink"
        >
          <ChevronDown
            className={`size-3.5 transition-transform ${showEvidence ? "rotate-180" : ""}`}
            aria-hidden
          />
          Evidence behind this
        </button>

        {showEvidence ? (
          <ul className="mt-2.5 space-y-2 border-l border-line pl-3">
            {candidate.evidence.map((item) => (
              <li key={item.id} className="text-[12px] leading-relaxed">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-muted underline underline-offset-2 hover:text-accent"
                    >
                      {item.title}
                    </a>
                  ) : (
                    <span className="text-muted">{item.title}</span>
                  )}
                  <span className="text-ghost">
                    {item.sourceName ?? item.kind.replace(/_/g, " ")} · {item.capturedAt}
                  </span>
                </div>
                {item.excerpt ? (
                  <p className="mt-0.5 line-clamp-2 text-faint">{item.excerpt}</p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        {canDecide && pending ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
            <ActionButton
              size="sm"
              variant="accent"
              icon={Check}
              action={() => decideCandidateAction(slug, candidate.id, "approved")}
              onDone={() => router.refresh()}
            >
              Approve
            </ActionButton>
            <Button size="sm" variant="secondary" icon={X} onClick={() => setRejecting(true)}>
              Reject
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              Edit first
            </Button>
          </div>
        ) : null}

        {canDecide && candidate.decision === "approved" && candidate.patternId ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
            <Button size="sm" variant="secondary" onClick={() => setTesting(true)}>
              Queue a test
            </Button>
            <Link
              href={`/app/${slug}/intelligence/signals/${candidate.patternId}`}
              className="text-[12px] text-muted hover:text-ink"
            >
              Open signal
            </Link>
          </div>
        ) : null}
      </CardBody>

      <RejectDialog
        slug={slug}
        candidate={candidate}
        open={rejecting}
        onOpenChange={setRejecting}
        onDone={() => router.refresh()}
      />
      <EditCandidateDialog
        slug={slug}
        candidate={candidate}
        open={editing}
        onOpenChange={setEditing}
        onDone={() => router.refresh()}
      />
      {candidate.patternId ? (
        <QueueTestDialog
          slug={slug}
          patternId={candidate.patternId}
          title={candidate.title}
          open={testing}
          onOpenChange={setTesting}
          onDone={() => router.refresh()}
        />
      ) : null}
    </Card>
  );
}

function RejectDialog({
  slug,
  candidate,
  open,
  onOpenChange,
  onDone,
}: {
  slug: string;
  candidate: CandidateView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const [note, setNote] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  const submit = () => {
    startTransition(async () => {
      const result = await decideCandidateAction(slug, candidate.id, "rejected", note);
      if (result.ok) {
        toast.success(result.message ?? "Rejected.");
        onOpenChange(false);
        onDone();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader
          title="Reject this signal"
          description="A reason is required. A rejected signal with no explanation teaches the next cycle nothing."
        />
        <DialogBody>
          <Field label="Why is this not worth acting on?">
            <Textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Only two of the cited items are from our actual buyers; the rest are from a different segment."
            />
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="accent" loading={pending} onClick={submit}>
            Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditCandidateDialog({
  slug,
  candidate,
  open,
  onOpenChange,
  onDone,
}: {
  slug: string;
  candidate: CandidateView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const [confidence, setConfidence] = React.useState(candidate.confidence);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader
          title="Edit before deciding"
          description="Your edits are recorded, so the brief can say honestly which signals a person rewrote."
        />
        <ActionForm
          action={updateCandidateAction.bind(null, slug, candidate.id)}
          onSuccess={() => {
            onOpenChange(false);
            onDone();
          }}
        >
          {({ fieldErrors, error }) => (
            <>
              <DialogBody className="space-y-4">
                <FormError error={error} />
                <Field label="Kind" error={fieldErrors.kind}>
                  <NativeSelect name="kind" defaultValue={candidate.kind}>
                    {CANDIDATE_KIND_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <Field label="Title" error={fieldErrors.title}>
                  <Input name="title" defaultValue={candidate.title} required />
                </Field>
                <Field label="Rationale" optional error={fieldErrors.rationale}>
                  <Textarea name="rationale" rows={4} defaultValue={candidate.rationale ?? ""} />
                </Field>
                <Field label="Why it matters commercially" optional error={fieldErrors.soWhat}>
                  <Textarea name="soWhat" rows={3} defaultValue={candidate.soWhat ?? ""} />
                </Field>
                <Field
                  label={`Confidence — ${confidence}%`}
                  hint="Should reflect how many independent items support it, not how compelling it sounds."
                >
                  <Slider
                    min={0}
                    max={100}
                    step={5}
                    value={[confidence]}
                    onValueChange={([v]) => setConfidence(v ?? 0)}
                  />
                  <input type="hidden" name="confidence" value={confidence} />
                </Field>
              </DialogBody>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <SubmitButton variant="accent">Save edits</SubmitButton>
              </DialogFooter>
            </>
          )}
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}

export function QueueTestDialog({
  slug,
  patternId,
  title,
  open,
  onOpenChange,
  onDone,
}: {
  slug: string;
  patternId: string;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const [impact, setImpact] = React.useState(3);
  const [effort, setEffort] = React.useState(3);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader
          title="Queue a content test"
          description="A test needs a defined read. Without one, a result is a matter of opinion and the loop never closes."
        />
        <ActionForm
          action={createTestFromSignalAction.bind(null, slug, patternId)}
          onSuccess={() => {
            onOpenChange(false);
            onDone();
          }}
        >
          {({ fieldErrors, error }) => (
            <>
              <DialogBody className="space-y-4">
                <FormError error={error} />
                <Field label="What are we testing?" error={fieldErrors.title}>
                  <Input
                    name="title"
                    required
                    defaultValue={`Publish three pieces that lead with: ${title}`}
                  />
                </Field>
                <Field label="Details" optional error={fieldErrors.description}>
                  <Textarea name="description" rows={3} />
                </Field>
                <Field
                  label="How will this be read?"
                  hint="Name the measure and the threshold you would accept as an answer."
                  error={fieldErrors.successMetric}
                >
                  <Input
                    name="successMetric"
                    required
                    placeholder="Qualified inquiries per published piece, over 3 weeks"
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={`Impact — ${impact}/5`}>
                    <Slider
                      min={1}
                      max={5}
                      step={1}
                      value={[impact]}
                      onValueChange={([v]) => setImpact(v ?? 3)}
                    />
                    <input type="hidden" name="impact" value={impact} />
                  </Field>
                  <Field label={`Effort — ${effort}/5`}>
                    <Slider
                      min={1}
                      max={5}
                      step={1}
                      value={[effort]}
                      onValueChange={([v]) => setEffort(v ?? 3)}
                    />
                    <input type="hidden" name="effort" value={effort} />
                  </Field>
                </div>
              </DialogBody>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <SubmitButton variant="accent">Queue test</SubmitButton>
              </DialogFooter>
            </>
          )}
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------------- Brief ---------------------------------- */

export function BriefSummaryPanel({
  slug,
  runId,
  summary,
  label,
  focus,
  periodStart,
  periodEnd,
  approvedCount,
  pendingCount,
  sourcesRead,
  sourcesUnavailable,
}: {
  slug: string;
  runId: string;
  summary: string;
  label: string;
  focus: string;
  periodStart: string;
  periodEnd: string;
  approvedCount: number;
  pendingCount: number;
  sourcesRead: number;
  sourcesUnavailable: number;
}) {
  const router = useRouter();

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-medium text-ink">5 · The brief</h2>
          <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-muted">
            What the client reads. Draft it, then edit it — it goes out exactly as written, and is
            frozen the moment the brief is published.
          </p>
        </div>
        <ActionButton
          variant="secondary"
          icon={Sparkles}
          action={() => draftBriefSummaryAction(slug, runId)}
          onDone={() => router.refresh()}
        >
          Draft opening
        </ActionButton>
      </div>

      {pendingCount > 0 ? (
        <Notice tone="warning" icon={Telescope} title={`${pendingCount} candidate(s) undecided`}>
          The brief cannot be published while anything proposed is still awaiting a decision.
        </Notice>
      ) : null}

      <Card>
        <CardBody className="pt-4">
          <ActionForm action={updateRunAction.bind(null, slug, runId)}>
            {({ fieldErrors, error }) => (
              <div className="space-y-4">
                <FormError error={error} />
                <input type="hidden" name="label" value={label} />
                <input type="hidden" name="focus" value={focus} />
                <input type="hidden" name="periodStart" value={periodStart} />
                <input type="hidden" name="periodEnd" value={periodEnd} />
                <Field
                  label="Opening"
                  hint={`${approvedCount} approved signal(s) · ${sourcesRead} source(s) read${sourcesUnavailable ? ` · ${sourcesUnavailable} not collectable` : ""}`}
                  error={fieldErrors.summary}
                >
                  <Textarea
                    name="summary"
                    rows={8}
                    defaultValue={summary}
                    placeholder="What did we find, why does it matter to this business, and what are we doing about it?"
                  />
                </Field>
                <div className="flex justify-end">
                  <SubmitButton variant="secondary">Save opening</SubmitButton>
                </div>
              </div>
            )}
          </ActionForm>
        </CardBody>
      </Card>
    </section>
  );
}

