"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Archive, CheckCircle2, MoreHorizontal, Pencil, PenLine, Star, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/controls";
import { Notice } from "@/components/ui/feedback";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import { ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import { toast } from "@/components/ui/toast";
import { deleteIdeaAction, setIdeaStatusAction, updateIdeaAction } from "@/lib/actions/ideas";
import { createScriptFromIdeaAction } from "@/lib/actions/scripts";
import {
  COMMERCIAL_INTENT_OPTIONS,
  FORMAT_OPTIONS,
  PLATFORM_OPTIONS,
  SCRIPT_TYPE_OPTIONS,
} from "@/lib/domain/enums";
import { ScoreFields } from "../../idea-actions";

type Defaults = {
  title: string;
  concept: string;
  angle: string;
  hookConcept: string;
  audience: string;
  painDesire: string;
  pillar: string;
  platform: string;
  format: string;
  objective: string;
  cta: string;
  commercialIntent: string;
  relevanceScore: number;
  noveltyScore: number;
  proofStrength: number;
  formatFit: number;
  rationale: string;
};

export function IdeaDetailActions({
  slug,
  ideaId,
  status,
  hasScript,
  canApprove,
  canEdit,
  canScript,
  defaults,
  experts = [],
}: {
  /** TEAM-08: experts who may speak the piece; the script is written in their voice. */
  experts?: { id: string; name: string }[];
  slug: string;
  ideaId: string;
  status: string;
  hasScript: boolean;
  canApprove: boolean;
  canEdit: boolean;
  canScript: boolean;
  defaults: Defaults;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = React.useState(false);
  const [scriptOpen, setScriptOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const move = (next: string) => {
    startTransition(async () => {
      const result = await setIdeaStatusAction(slug, [ideaId], next);
      if (result.ok) {
        toast.success(result.message ?? "Idea updated.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const remove = () => {
    if (!window.confirm("Delete this idea? This cannot be undone.")) return;
    startTransition(async () => {
      const result = await deleteIdeaAction(slug, ideaId);
      if (result.ok) {
        toast.success("Idea deleted.");
        router.push(`/app/${slug}/create`);
      } else {
        toast.error(result.error);
      }
    });
  };

  const canSendToScripting = status === "approved" && !hasScript && canScript;

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      {status === "backlog" && canEdit ? (
        <Button icon={Star} loading={pending} onClick={() => move("shortlisted")}>
          Shortlist
        </Button>
      ) : null}

      {["backlog", "shortlisted"].includes(status) && canApprove ? (
        <Button variant="accent" icon={CheckCircle2} loading={pending} onClick={() => move("approved")}>
          Approve
        </Button>
      ) : null}

      {canSendToScripting ? (
        <Button variant="accent" icon={PenLine} onClick={() => setScriptOpen(true)}>
          Write the script
        </Button>
      ) : null}

      {canEdit ? (
        <>
          <Button variant="secondary" icon={Pencil} onClick={() => setEditOpen(true)}>
            Edit
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" icon={MoreHorizontal} aria-label="More actions">
                <span className="sr-only">More actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {status !== "rejected" ? (
                <DropdownMenuItem icon={X} onSelect={() => move("rejected")}>
                  Reject
                </DropdownMenuItem>
              ) : null}
              {status !== "archived" ? (
                <DropdownMenuItem icon={Archive} onSelect={() => move("archived")}>
                  Archive
                </DropdownMenuItem>
              ) : null}
              {["rejected", "archived"].includes(status) ? (
                <DropdownMenuItem onSelect={() => move("backlog")}>
                  Return to backlog
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem icon={Trash2} destructive onSelect={remove}>
                Delete idea
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ) : null}

      {/* ---------------------------------- Edit --------------------------------- */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent size="lg">
          <DialogHeader title="Edit idea" />
          <ActionForm
            action={updateIdeaAction.bind(null, slug, ideaId)}
            onSuccess={() => {
              setEditOpen(false);
              router.refresh();
            }}
            className="contents"
          >
            {({ fieldErrors, error }) => (
              <>
                <DialogBody className="space-y-4">
                  <FormError error={error} />
                  <Field label="Title" htmlFor="editTitle" error={fieldErrors.title}>
                    <Input id="editTitle" name="title" defaultValue={defaults.title} required />
                  </Field>
                  <Field label="Concept" htmlFor="editConcept">
                    <Textarea id="editConcept" name="concept" defaultValue={defaults.concept} rows={3} />
                  </Field>
                  <Field label="Angle" htmlFor="editAngle">
                    <Textarea id="editAngle" name="angle" defaultValue={defaults.angle} rows={2} />
                  </Field>
                  <Field label="Hook concept" htmlFor="editHook">
                    <Textarea id="editHook" name="hookConcept" defaultValue={defaults.hookConcept} rows={2} />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Audience" htmlFor="editAudience">
                      <Input id="editAudience" name="audience" defaultValue={defaults.audience} />
                    </Field>
                    <Field label="Pain or desire" htmlFor="editPain">
                      <Input id="editPain" name="painDesire" defaultValue={defaults.painDesire} />
                    </Field>
                    <Field label="Pillar" htmlFor="editPillar" optional>
                      <Input id="editPillar" name="pillar" defaultValue={defaults.pillar} />
                    </Field>
                    <Field label="Objective" htmlFor="editObjective" optional>
                      <Input id="editObjective" name="objective" defaultValue={defaults.objective} />
                    </Field>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Platform" htmlFor="editPlatform">
                      <NativeSelect id="editPlatform" name="platform" defaultValue={defaults.platform}>
                        {PLATFORM_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                    <Field label="Format" htmlFor="editFormat">
                      <NativeSelect id="editFormat" name="format" defaultValue={defaults.format}>
                        {FORMAT_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                    <Field label="Intent" htmlFor="editIntent">
                      <NativeSelect
                        id="editIntent"
                        name="commercialIntent"
                        defaultValue={defaults.commercialIntent}
                      >
                        {COMMERCIAL_INTENT_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                  </div>
                  <Field label="CTA" htmlFor="editCta" optional>
                    <Input id="editCta" name="cta" defaultValue={defaults.cta} />
                  </Field>
                  <ScoreFields defaults={defaults} />
                  <Field label="Rationale" htmlFor="editRationale" optional>
                    <Textarea
                      id="editRationale"
                      name="rationale"
                      defaultValue={defaults.rationale}
                      rows={3}
                    />
                  </Field>
                </DialogBody>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setEditOpen(false)}>
                    Cancel
                  </Button>
                  <SubmitButton variant="primary">Save idea</SubmitButton>
                </DialogFooter>
              </>
            )}
          </ActionForm>
        </DialogContent>
      </Dialog>

      {/* ------------------------------ Send to script --------------------------- */}
      <Dialog open={scriptOpen} onOpenChange={setScriptOpen}>
        <DialogContent>
          <DialogHeader
            title="Write the script"
            description="Creates a script linked to this idea, preserving the lineage from research through to the published piece."
          />
          <ActionForm<{ id: string; isDemo: boolean }>
            action={createScriptFromIdeaAction.bind(null, slug)}
            onSuccess={(data) => {
              setScriptOpen(false);
              router.push(`/app/${slug}/create/scripts/${data.id}`);
            }}
            className="contents"
          >
            {({ error }) => (
              <>
                <DialogBody className="space-y-4">
                  <FormError error={error} />
                  <input type="hidden" name="ideaId" value={ideaId} />
                  {experts.length ? (
                    <Field label="Who will say it" htmlFor="speakerUserId" hint="The script is written in that person's voice.">
                      <NativeSelect id="speakerUserId" name="speakerUserId" defaultValue="">
                        <option value="">The founder</option>
                        {experts.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.name}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                  ) : null}

                  <Field label="Script type" htmlFor="scriptType">
                    <NativeSelect id="scriptType" name="scriptType" defaultValue="founder_pov">
                      {SCRIPT_TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>

                  <Field
                    label="Target length"
                    htmlFor="targetSeconds"
                    hint="Used to size the script and to estimate the recording batch."
                  >
                    <NativeSelect id="targetSeconds" name="targetSeconds" defaultValue="60">
                      <option value="30">30 seconds</option>
                      <option value="60">60 seconds</option>
                      <option value="90">90 seconds</option>
                      <option value="180">3 minutes</option>
                      <option value="480">8 minutes</option>
                    </NativeSelect>
                  </Field>

                  <label className="flex items-start gap-2.5">
                    <Checkbox name="generate" defaultChecked value="on" className="mt-0.5" />
                    <span>
                      <span className="block text-[13px] text-ink">Draft it now</span>
                      <span className="mt-0.5 block text-[12px] leading-relaxed text-muted">
                        Generates a first draft with alternate hooks and filming notes. Any factual
                        claim it makes is flagged for you to verify before recording.
                      </span>
                    </span>
                  </label>

                  <Notice tone="neutral">
                    Approving this idea moves it to <strong className="text-ink">Scripted</strong>.
                    The script becomes the authoritative record from that point.
                  </Notice>
                </DialogBody>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setScriptOpen(false)}>
                    Cancel
                  </Button>
                  <SubmitButton variant="accent" pendingLabel="Writing…">
                    Create script
                  </SubmitButton>
                </DialogFooter>
              </>
            )}
          </ActionForm>
        </DialogContent>
      </Dialog>
    </div>
  );
}
