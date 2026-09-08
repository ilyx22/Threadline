"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Check,
  History,
  Loader2,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Badge, Pill } from "@/components/ui/badge";
import { Button, IconButton } from "@/components/ui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Notice } from "@/components/ui/feedback";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Tooltip } from "@/components/ui/menu";
import { ScriptQaBadge } from "@/components/ui/status";
import { CopyButton } from "@/components/ui/copy-button";
import { toast } from "@/components/ui/toast";
import { duration, estimateSpokenSeconds, wordCount } from "@/lib/utils/format";
import { relativeTime } from "@/lib/utils/dates";
import { REFINE_INSTRUCTIONS } from "@/lib/ai/prompts";
import {
  addClaimAction,
  generateHooksAction,
  refineScriptAction,
  regenerateScriptAction,
  restoreVersionAction,
  saveScriptAction,
  selectHookAction,
  sendToRecordingAction,
  setClaimStatusAction,
  setScriptStateAction,
} from "@/lib/actions/scripts";
import { ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";

type Claim = { id: string; text: string; status: string; note?: string };

type Current = {
  hook: string;
  altHooks: string[];
  body: string;
  cta: string;
  filmingNotes: string;
  claims: Claim[];
  contextUsed: string[];
  version: number;
};

/**
 * Script editor.
 *
 * The central product rule lives here: a script carrying unverified claims
 * cannot be marked ready to record or approved. The UI makes that visible and
 * the server enforces it — the control is disabled AND the action refuses.
 */
export function ScriptEditor({
  slug,
  isLive,
  canEdit,
  canApprove,
  inProduction,
  script,
  current,
  history,
}: {
  slug: string;
  isLive: boolean;
  canEdit: boolean;
  canApprove: boolean;
  inProduction: boolean;
  script: {
    id: string;
    title: string;
    scriptType: string;
    platform: string;
    qaState: string;
    estimatedSeconds: number;
    currentVersion: number;
    ideaAngle: string | null;
    ideaHook: string | null;
  };
  current: Current | null;
  history: {
    id: string;
    version: number;
    changeSummary: string | null;
    generatedBy: string;
    createdAt: string;
    authorName: string;
    wordCount: number;
  }[];
}) {
  const router = useRouter();
  const [hook, setHook] = React.useState(current?.hook ?? "");
  const [body, setBody] = React.useState(current?.body ?? "");
  const [cta, setCta] = React.useState(current?.cta ?? "");
  const [notes, setNotes] = React.useState(current?.filmingNotes ?? "");
  const [pending, startTransition] = React.useTransition();
  const [refining, setRefining] = React.useState<string | null>(null);
  const [claimOpen, setClaimOpen] = React.useState(false);

  // Reset local state when the server sends a new version through.
  React.useEffect(() => {
    setHook(current?.hook ?? "");
    setBody(current?.body ?? "");
    setCta(current?.cta ?? "");
    setNotes(current?.filmingNotes ?? "");
  }, [current]);

  const dirty =
    hook !== (current?.hook ?? "") ||
    body !== (current?.body ?? "") ||
    cta !== (current?.cta ?? "") ||
    notes !== (current?.filmingNotes ?? "");

  const claims = current?.claims ?? [];
  const unverified = claims.filter((c) => c.status === "unverified");
  const blocked = unverified.length > 0;

  const words = wordCount(body);
  const seconds = body.trim() ? estimateSpokenSeconds(body) : 0;

  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) => {
    startTransition(async () => {
      const result = await fn();
      if (result.ok) {
        if (result.message) toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error ?? "Something went wrong.");
      }
    });
  };

  const save = () => {
    const fd = new FormData();
    fd.set("hook", hook);
    fd.set("body", body);
    fd.set("cta", cta);
    fd.set("filmingNotes", notes);
    run(() => saveScriptAction(slug, script.id, null, fd));
  };

  const refine = (instruction: string) => {
    setRefining(instruction);
    const fd = new FormData();
    fd.set("instruction", instruction);
    startTransition(async () => {
      const result = await refineScriptAction(slug, script.id, null, fd);
      setRefining(null);
      if (result.ok) {
        toast.success(result.message ?? "Revision saved.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const generateHooks = () => {
    const fd = new FormData();
    fd.set("count", "5");
    run(() => generateHooksAction(slug, script.id, null, fd));
  };

  return (
    <div className="space-y-6">
      {/* --------------------------------- Header --------------------------------- */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <ScriptQaBadge state={script.qaState} />
            <Pill>{script.scriptType.replace(/_/g, " ")}</Pill>
            <Pill>{script.platform.replace(/_/g, " ")}</Pill>
            <Pill>v{script.currentVersion}</Pill>
            {blocked ? (
              <Badge tone="warning" icon={AlertTriangle}>
                {unverified.length} unverified {unverified.length === 1 ? "claim" : "claims"}
              </Badge>
            ) : claims.length > 0 ? (
              <Badge tone="positive" icon={ShieldCheck}>
                All claims verified
              </Badge>
            ) : null}
          </div>
          <h1 className="mt-3 text-hero">{script.title}</h1>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {canEdit && dirty ? (
            <Button variant="primary" icon={Save} loading={pending} onClick={save}>
              Save version
            </Button>
          ) : null}

          {canEdit && script.qaState === "ai_draft" ? (
            <Button
              variant="secondary"
              loading={pending}
              onClick={() =>
                run(() =>
                  setScriptStateAction(slug, script.id, blocked ? "needs_fact_check" : "ready_to_record"),
                )
              }
            >
              {blocked ? "Send for fact check" : "Mark ready to record"}
            </Button>
          ) : null}

          {canEdit && script.qaState === "needs_fact_check" ? (
            <Tooltip
              content={
                blocked
                  ? `${unverified.length} claim${unverified.length === 1 ? "" : "s"} still need verifying`
                  : undefined
              }
            >
              <span>
                <Button
                  variant="secondary"
                  disabled={blocked}
                  loading={pending}
                  onClick={() => run(() => setScriptStateAction(slug, script.id, "ready_to_record"))}
                >
                  Mark ready to record
                </Button>
              </span>
            </Tooltip>
          ) : null}

          {canApprove && script.qaState === "ready_to_record" ? (
            <Button
              variant="accent"
              icon={BadgeCheck}
              disabled={blocked}
              loading={pending}
              onClick={() => run(() => setScriptStateAction(slug, script.id, "approved"))}
            >
              Approve
            </Button>
          ) : null}

          {canApprove && script.qaState === "approved" && !inProduction ? (
            <Button
              variant="accent"
              iconRight={ArrowRight}
              loading={pending}
              onClick={() => run(() => sendToRecordingAction(slug, script.id))}
            >
              Send to recording
            </Button>
          ) : null}
        </div>
      </header>

      {blocked ? (
        <Notice tone="warning" icon={AlertTriangle} title="Fact check required before recording">
          This script contains {unverified.length} statement{unverified.length === 1 ? "" : "s"} that
          a reasonable person could challenge. Verify or remove{" "}
          {unverified.length === 1 ? "it" : "them"} below — the system will not let this reach the
          recording queue until you do.
        </Notice>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        {/* --------------------------------- Editor -------------------------------- */}
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader
              title="Hook"
              eyebrow="First two seconds"
              description="It has to work with the sound off and no context."
              action={
                canEdit ? (
                  <Button size="xs" variant="ghost" icon={Sparkles} loading={pending} onClick={generateHooks}>
                    Generate 5 hooks
                  </Button>
                ) : null
              }
            />
            <CardBody className="pt-0">
              <Textarea
                value={hook}
                onChange={(e) => setHook(e.target.value)}
                rows={2}
                disabled={!canEdit}
                className="text-[15px] leading-relaxed"
                placeholder="Open on the strongest line you have."
              />

              {current && current.altHooks.length > 0 ? (
                <div className="mt-4">
                  <p className="text-eyebrow mb-2 text-faint">Alternates</p>
                  <ul className="space-y-1.5">
                    {current.altHooks.map((alt, i) => (
                      <li
                        key={i}
                        className="group flex items-start gap-2.5 rounded-md border border-line bg-surface px-3 py-2"
                      >
                        <span className="min-w-0 flex-1 text-[12.5px] leading-relaxed text-muted">
                          {alt}
                        </span>
                        {canEdit ? (
                          <button
                            type="button"
                            onClick={() => run(() => selectHookAction(slug, script.id, alt))}
                            className="shrink-0 whitespace-nowrap text-[11.5px] text-accent opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                          >
                            Use this
                          </button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Script"
              eyebrow="Body"
              action={
                <span className="text-[12px] tabular text-faint">
                  {words} words · ~{duration(seconds)} spoken
                </span>
              }
            />
            <CardBody className="pt-0">
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={20}
                disabled={!canEdit}
                className="font-sans text-[14px] leading-[1.85]"
                placeholder="Write for the ear. Short sentences. One idea per line."
              />
            </CardBody>
            {canEdit ? (
              <CardFooter>
                <span className="text-[12px] text-faint">
                  {dirty ? "Unsaved changes" : `Saved as version ${current?.version ?? 1}`}
                </span>
                <div className="flex items-center gap-2">
                  <CopyButton value={`${hook}\n\n${body}\n\n${cta}`.trim()} label="Copy script" />
                  <Button variant="primary" icon={Save} disabled={!dirty} loading={pending} onClick={save}>
                    Save version
                  </Button>
                </div>
              </CardFooter>
            ) : null}
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader title="CTA" eyebrow="Close" />
              <CardBody className="pt-0">
                <Textarea
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                  rows={3}
                  disabled={!canEdit}
                  placeholder="One clause. Long CTAs lose retention."
                />
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Filming notes" eyebrow="Delivery" />
              <CardBody className="pt-0">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  disabled={!canEdit}
                  placeholder="How to deliver it, not how to edit it."
                />
              </CardBody>
            </Card>
          </div>
        </div>

        {/* -------------------------------- Sidebar -------------------------------- */}
        <div className="space-y-6">
          {/* Refinement */}
          {canEdit ? (
            <Card>
              <CardHeader
                title="Refine"
                eyebrow="Revisions"
                description="Each creates a new version with a change summary. Nothing is overwritten."
              />
              <CardBody className="pt-0">
                {!isLive ? (
                  <Notice tone="warning" className="mb-3">
                    Demo mode — refinements are composed deterministically, not by a live model.
                  </Notice>
                ) : null}
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(REFINE_INSTRUCTIONS) as (keyof typeof REFINE_INSTRUCTIONS)[]).map(
                    (key) => (
                      <Tooltip key={key} content={REFINE_INSTRUCTIONS[key].instruction}>
                        <button
                          type="button"
                          disabled={pending || !body.trim()}
                          onClick={() => refine(key)}
                          className={cn(
                            "inline-flex h-7 items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 text-[12px] text-muted transition-colors",
                            "hover:border-line-strong hover:text-ink",
                            "disabled:pointer-events-none disabled:opacity-40",
                          )}
                        >
                          {refining === key ? (
                            <Loader2 className="size-3 animate-spin" aria-hidden />
                          ) : (
                            <Wand2 className="size-3" aria-hidden />
                          )}
                          {REFINE_INSTRUCTIONS[key].label}
                        </button>
                      </Tooltip>
                    ),
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={RotateCcw}
                  className="mt-3 -ml-3"
                  loading={pending}
                  onClick={() => {
                    if (!window.confirm("Regenerate the whole script? The current version is kept in history."))
                      return;
                    run(() => regenerateScriptAction(slug, script.id));
                  }}
                >
                  Regenerate entirely
                </Button>
              </CardBody>
            </Card>
          ) : null}

          {/* Claims */}
          <Card className={blocked ? "border-warning/30" : undefined}>
            <CardHeader
              title="Factual claims"
              eyebrow="Human verification"
              description="Anything a reasonable person could challenge."
              action={
                canEdit ? (
                  <Button size="xs" variant="ghost" onClick={() => setClaimOpen(true)}>
                    Add
                  </Button>
                ) : null
              }
            />
            <CardBody className="pt-0">
              {claims.length === 0 ? (
                <p className="text-[12.5px] leading-relaxed text-faint">
                  No claims flagged. If the script states a number, a frequency or an outcome, add it
                  here so it gets checked.
                </p>
              ) : (
                <ul className="space-y-3">
                  {claims.map((claim) => (
                    <li
                      key={claim.id}
                      className={cn(
                        "rounded-md border p-3",
                        claim.status === "verified"
                          ? "border-positive/25 bg-positive-soft"
                          : claim.status === "removed"
                            ? "border-line bg-surface opacity-60"
                            : "border-warning/25 bg-warning-soft",
                      )}
                    >
                      <p
                        className={cn(
                          "text-[12.5px] leading-relaxed text-ink",
                          claim.status === "removed" && "line-through",
                        )}
                      >
                        {claim.text}
                      </p>
                      {claim.note ? (
                        <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">{claim.note}</p>
                      ) : null}
                      {canEdit ? (
                        <div className="mt-2.5 flex items-center gap-1.5">
                          {claim.status !== "verified" ? (
                            <Button
                              size="xs"
                              variant="ghost"
                              icon={Check}
                              loading={pending}
                              onClick={() =>
                                run(() => setClaimStatusAction(slug, script.id, claim.id, "verified"))
                              }
                            >
                              Verified
                            </Button>
                          ) : null}
                          {claim.status !== "removed" ? (
                            <Button
                              size="xs"
                              variant="ghost"
                              icon={X}
                              loading={pending}
                              onClick={() =>
                                run(() => setClaimStatusAction(slug, script.id, claim.id, "removed"))
                              }
                            >
                              Remove
                            </Button>
                          ) : null}
                          {claim.status !== "unverified" ? (
                            <Button
                              size="xs"
                              variant="ghost"
                              icon={RotateCcw}
                              loading={pending}
                              onClick={() =>
                                run(() => setClaimStatusAction(slug, script.id, claim.id, "unverified"))
                              }
                            >
                              Reopen
                            </Button>
                          ) : null}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          {/* Version history */}
          <Card>
            <CardHeader title="Version history" eyebrow={`${history.length} versions`} />
            <CardBody className="pt-0">
              <ul className="space-y-2.5">
                {history.map((version) => (
                  <li
                    key={version.id}
                    className={cn(
                      "rounded-md border px-3 py-2.5",
                      version.version === script.currentVersion
                        ? "border-accent-line bg-accent-soft"
                        : "border-line bg-surface",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] font-medium text-ink">v{version.version}</span>
                      <div className="flex items-center gap-1.5">
                        {version.generatedBy !== "human" ? (
                          <Pill>{version.generatedBy === "ai" ? "AI" : "AI revision"}</Pill>
                        ) : null}
                        {canEdit && version.version !== script.currentVersion ? (
                          <IconButton
                            icon={History}
                            label={`Restore version ${version.version}`}
                            size="xs"
                            onClick={() => run(() => restoreVersionAction(slug, script.id, version.version))}
                          />
                        ) : null}
                      </div>
                    </div>
                    {version.changeSummary ? (
                      <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                        {version.changeSummary}
                      </p>
                    ) : null}
                    <p className="mt-1 text-[11px] text-ghost">
                      {version.authorName} · {version.wordCount} words ·{" "}
                      {relativeTime(new Date(version.createdAt))}
                    </p>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          {current && current.contextUsed.length > 0 ? (
            <Card>
              <CardHeader title="Context used" eyebrow="Provenance" />
              <CardBody className="pt-0">
                <div className="flex flex-wrap gap-1.5">
                  {current.contextUsed.map((block) => (
                    <Pill key={block}>{block.replace(/_/g, " ").toLowerCase()}</Pill>
                  ))}
                </div>
                <p className="mt-3 text-[11.5px] leading-relaxed text-ghost">
                  These Brand Brain blocks were supplied to the generation that produced this
                  version.
                </p>
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>

      {/* Add claim */}
      <Dialog open={claimOpen} onOpenChange={setClaimOpen}>
        <DialogContent size="sm">
          <DialogHeader
            title="Flag a claim"
            description="Anything that states a number, a frequency, a comparison or an outcome."
          />
          <ActionForm
            action={addClaimAction.bind(null, slug, script.id)}
            onSuccess={() => {
              setClaimOpen(false);
              router.refresh();
            }}
            className="contents"
          >
            {({ fieldErrors, error }) => (
              <>
                <DialogBody className="space-y-4">
                  <FormError error={error} />
                  <Field label="The statement" htmlFor="claimText" error={fieldErrors.text}>
                    <Textarea id="claimText" name="text" rows={3} required autoFocus />
                  </Field>
                  <Field label="What needs checking" htmlFor="claimNote" optional>
                    <Input id="claimNote" name="note" placeholder="Confirm against the engagement record." />
                  </Field>
                </DialogBody>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setClaimOpen(false)}>
                    Cancel
                  </Button>
                  <SubmitButton variant="primary">Flag claim</SubmitButton>
                </DialogFooter>
              </>
            )}
          </ActionForm>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Unused in this file but exported for the recording room's read-only view. */
export function ScriptReadOnly({ hook, body, cta }: { hook: string; body: string; cta: string }) {
  return (
    <div className="space-y-4">
      <p className="text-[16px] font-medium leading-relaxed text-ink">{hook}</p>
      <div className="whitespace-pre-wrap text-[14px] leading-[1.85] text-muted">{body}</div>
      {cta ? <p className="border-t border-line pt-4 text-[14px] text-accent">{cta}</p> : null}
    </div>
  );
}
