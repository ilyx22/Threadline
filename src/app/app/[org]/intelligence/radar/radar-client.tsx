"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge, Pill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/feedback";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { ResearchKindBadge } from "@/components/ui/status";
import { ActionButton, ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import {
  createResearchItemAction,
  deleteCompetitorAction,
  deleteResearchItemAction,
  saveCompetitorAction,
  updateResearchItemAction,
} from "@/lib/actions/intelligence";
import { RESEARCH_KINDS, RESEARCH_KIND_META } from "@/lib/domain/enums";
import { compactNumber } from "@/lib/utils/format";
import { formatDate } from "@/lib/utils/dates";

export type ResearchItemView = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  url: string | null;
  sourceName: string | null;
  author: string | null;
  platform: string | null;
  competitorId: string | null;
  competitorName: string | null;
  tags: string[];
  metrics: Record<string, number>;
  capturedAt: string;
  usedByIdeas: number;
  usedBySignals: number;
};

type CompetitorOption = { id: string; name: string };

export function ResearchList({
  slug,
  items,
  competitors,
  canEdit,
}: {
  slug: string;
  items: ResearchItemView[];
  competitors: CompetitorOption[];
  canEdit: boolean;
}) {
  const [editing, setEditing] = React.useState<ResearchItemView | null>(null);

  return (
    <>
      <ul className="grid gap-3 lg:grid-cols-2">
        {items.map((item) => (
          <li key={item.id}>
            <Card className="flex h-full flex-col" interactive>
              <CardBody className="flex-1 pt-4">
                <div className="flex items-start justify-between gap-3">
                  <ResearchKindBadge kind={item.kind} />
                  <div className="flex shrink-0 items-center gap-0.5">
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="rounded p-1.5 text-ghost transition-colors hover:text-muted"
                        aria-label="Open source"
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                    ) : null}
                    {canEdit ? (
                      <>
                        <Button
                          size="xs"
                          variant="ghost"
                          icon={Pencil}
                          onClick={() => setEditing(item)}
                          aria-label="Edit research item"
                        >
                          <span className="sr-only">Edit</span>
                        </Button>
                        <ActionButton
                          size="xs"
                          variant="ghost"
                          icon={Trash2}
                          action={() => deleteResearchItemAction(slug, item.id)}
                          confirm={`Delete "${item.title}"?`}
                        >
                          <span className="sr-only">Delete</span>
                        </ActionButton>
                      </>
                    ) : null}
                  </div>
                </div>

                <p className="mt-2.5 text-[13.5px] font-medium leading-snug text-ink">{item.title}</p>
                {item.body ? (
                  <p className="mt-2 line-clamp-4 text-[12.5px] leading-relaxed text-muted">
                    {item.body}
                  </p>
                ) : null}

                {Object.keys(item.metrics).length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-3">
                    {Object.entries(item.metrics).map(([key, value]) => (
                      <span key={key} className="text-[11.5px] text-faint">
                        <span className="tabular text-ink">{compactNumber(value)}</span> {key}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {item.tags.map((tag) => (
                    <Pill key={tag}>{tag}</Pill>
                  ))}
                  {item.competitorName ? <Pill>{item.competitorName}</Pill> : null}
                </div>
              </CardBody>

              <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-2.5">
                <span className="text-[11px] text-ghost">
                  {item.sourceName ?? "Manual"} · {formatDate(item.capturedAt, "short")}
                </span>
                {item.usedByIdeas > 0 || item.usedBySignals > 0 ? (
                  <span className="text-[11px] text-faint">
                    {item.usedByIdeas > 0 ? `${item.usedByIdeas} ideas` : null}
                    {item.usedByIdeas > 0 && item.usedBySignals > 0 ? " · " : null}
                    {item.usedBySignals > 0 ? `${item.usedBySignals} signals` : null}
                  </span>
                ) : (
                  <span className="text-[11px] text-ghost">Not yet used</span>
                )}
              </div>
            </Card>
          </li>
        ))}
      </ul>

      {editing ? (
        <ResearchDialog
          slug={slug}
          item={editing}
          competitors={competitors}
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
        />
      ) : null}
    </>
  );
}

export function NewResearchButton({
  slug,
  competitors,
}: {
  slug: string;
  competitors: { id: string; name: string }[];
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button icon={Plus} onClick={() => setOpen(true)}>
        Capture research
      </Button>
      {open ? (
        <ResearchDialog
          slug={slug}
          item={null}
          competitors={competitors}
          open
          onOpenChange={setOpen}
        />
      ) : null}
    </>
  );
}

function ResearchDialog({
  slug,
  item,
  competitors,
  open,
  onOpenChange,
}: {
  slug: string;
  item: ResearchItemView | null;
  competitors: CompetitorOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader
          title={item ? "Edit research" : "Capture research"}
          description="Record customer language verbatim. Paraphrasing into marketing copy destroys the value."
        />
        <ActionForm
          action={
            item
              ? updateResearchItemAction.bind(null, slug, item.id)
              : createResearchItemAction.bind(null, slug)
          }
          onSuccess={() => {
            onOpenChange(false);
            router.refresh();
          }}
          className="contents"
        >
          {({ fieldErrors, error }) => (
            <>
              <DialogBody className="space-y-4">
                <FormError error={error} />
                <Field label="Type" htmlFor="researchKind">
                  <NativeSelect id="researchKind" name="kind" defaultValue={item?.kind ?? "customer_language"}>
                    {RESEARCH_KINDS.map((k) => (
                      <option key={k} value={k}>
                        {RESEARCH_KIND_META[k].label}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>

                <Field label="Title" htmlFor="researchTitle" error={fieldErrors.title}>
                  <Input
                    id="researchTitle"
                    name="title"
                    defaultValue={item?.title}
                    required
                    autoFocus
                    placeholder="Their exact words, if this is customer language"
                  />
                </Field>

                <Field label="Detail" htmlFor="researchBody" hint="Context, why it matters, what it suggests." optional>
                  <Textarea id="researchBody" name="body" defaultValue={item?.body ?? ""} rows={5} />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Source URL" htmlFor="researchUrl" optional error={fieldErrors.url}>
                    <Input id="researchUrl" name="url" defaultValue={item?.url ?? ""} placeholder="https://" />
                  </Field>
                  <Field label="Source name" htmlFor="sourceName" optional>
                    <Input
                      id="sourceName"
                      name="sourceName"
                      defaultValue={item?.sourceName ?? ""}
                      placeholder="Diagnostic call notes"
                    />
                  </Field>
                  <Field label="Author" htmlFor="researchAuthor" optional>
                    <Input id="researchAuthor" name="author" defaultValue={item?.author ?? ""} />
                  </Field>
                  <Field label="Platform" htmlFor="researchPlatform" optional>
                    <Input id="researchPlatform" name="platform" defaultValue={item?.platform ?? ""} />
                  </Field>
                </div>

                {competitors.length > 0 ? (
                  <Field label="Competitor" htmlFor="competitorId" optional>
                    <NativeSelect
                      id="competitorId"
                      name="competitorId"
                      defaultValue={item?.competitorId ?? ""}
                    >
                      <option value="">Not competitor-specific</option>
                      {competitors.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                ) : null}

                <Field
                  label="Tags"
                  htmlFor="researchTags"
                  hint="Comma separated. Untagged research is effectively invisible to the system."
                >
                  <Input
                    id="researchTags"
                    name="tags"
                    defaultValue={item?.tags.join(", ")}
                    placeholder="objection, pain, hook"
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Views" htmlFor="researchViews" optional>
                    <Input
                      id="researchViews"
                      name="views"
                      type="number"
                      min={0}
                      defaultValue={item?.metrics.views}
                    />
                  </Field>
                  <Field label="Likes" htmlFor="researchLikes" optional>
                    <Input
                      id="researchLikes"
                      name="likes"
                      type="number"
                      min={0}
                      defaultValue={item?.metrics.likes}
                    />
                  </Field>
                  <Field label="Comments" htmlFor="researchComments" optional>
                    <Input
                      id="researchComments"
                      name="comments"
                      type="number"
                      min={0}
                      defaultValue={item?.metrics.comments}
                    />
                  </Field>
                </div>
              </DialogBody>
              <DialogFooter>
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <SubmitButton variant="primary">{item ? "Save" : "Capture"}</SubmitButton>
              </DialogFooter>
            </>
          )}
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------- Competitors ------------------------------- */

export type CompetitorView = {
  id: string;
  name: string;
  url: string | null;
  positioning: string | null;
  notes: string | null;
  threatLevel: string;
  itemCount: number;
};

export function CompetitorPanel({
  slug,
  competitors,
  canEdit,
}: {
  slug: string;
  competitors: CompetitorView[];
  canEdit: boolean;
}) {
  const [editing, setEditing] = React.useState<CompetitorView | null>(null);
  const [creating, setCreating] = React.useState(false);

  const threatTone = (level: string) =>
    level === "high" ? "negative" : level === "medium" ? "warning" : "outline";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[13px] text-muted">
          Who your audience already listens to. Their outliers are more useful than their averages.
        </p>
        {canEdit ? (
          <Button icon={Plus} size="sm" onClick={() => setCreating(true)}>
            Add competitor
          </Button>
        ) : null}
      </div>

      {competitors.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="No competitors tracked"
          description="Add the accounts your buyers actually follow — direct competitors and adjacent voices both matter."
          action={canEdit ? <Button icon={Plus} onClick={() => setCreating(true)}>Add competitor</Button> : undefined}
          compact
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {competitors.map((competitor) => (
            <Card key={competitor.id}>
              <CardHeader
                title={competitor.name}
                eyebrow={`${competitor.itemCount} research items`}
                action={
                  canEdit ? (
                    <div className="flex gap-0.5">
                      <Button
                        size="xs"
                        variant="ghost"
                        icon={Pencil}
                        onClick={() => setEditing(competitor)}
                      >
                        <span className="sr-only">Edit</span>
                      </Button>
                      <ActionButton
                        size="xs"
                        variant="ghost"
                        icon={Trash2}
                        action={() => deleteCompetitorAction(slug, competitor.id)}
                        confirm={`Remove ${competitor.name}? Research items captured about them are kept.`}
                      >
                        <span className="sr-only">Delete</span>
                      </ActionButton>
                    </div>
                  ) : null
                }
              />
              <CardBody className="space-y-3 pt-0">
                <Badge tone={threatTone(competitor.threatLevel)}>
                  {competitor.threatLevel} threat
                </Badge>
                {competitor.positioning ? (
                  <p className="text-[13px] leading-relaxed text-ink">{competitor.positioning}</p>
                ) : null}
                {competitor.notes ? (
                  <p className="text-[12.5px] leading-relaxed text-muted">{competitor.notes}</p>
                ) : null}
                {competitor.url ? (
                  <a
                    href={competitor.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1.5 text-[12px] text-accent transition-colors hover:text-accent-bright"
                  >
                    Visit
                    <ExternalLink className="size-3" aria-hidden />
                  </a>
                ) : null}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {(creating || editing) && canEdit ? (
        <CompetitorDialog
          slug={slug}
          competitor={editing}
          open
          onOpenChange={(open) => {
            if (!open) {
              setCreating(false);
              setEditing(null);
            }
          }}
        />
      ) : null}
    </div>
  );
}

function CompetitorDialog({
  slug,
  competitor,
  open,
  onOpenChange,
}: {
  slug: string;
  competitor: CompetitorView | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader title={competitor ? "Edit competitor" : "Add competitor"} />
        <ActionForm
          action={saveCompetitorAction.bind(null, slug, competitor?.id ?? null)}
          onSuccess={() => {
            onOpenChange(false);
            router.refresh();
          }}
          className="contents"
        >
          {({ fieldErrors, error }) => (
            <>
              <DialogBody className="space-y-4">
                <FormError error={error} />
                <Field label="Name" htmlFor="competitorName" error={fieldErrors.name}>
                  <Input id="competitorName" name="name" defaultValue={competitor?.name} required autoFocus />
                </Field>
                <Field label="URL" htmlFor="competitorUrl" optional>
                  <Input id="competitorUrl" name="url" defaultValue={competitor?.url ?? ""} placeholder="https://" />
                </Field>
                <Field label="Positioning" htmlFor="positioning" hint="How they present themselves.">
                  <Textarea
                    id="positioning"
                    name="positioning"
                    defaultValue={competitor?.positioning ?? ""}
                    rows={3}
                  />
                </Field>
                <Field
                  label="Notes"
                  htmlFor="competitorNotes"
                  hint="What works for them, what does not, and where the opening is."
                >
                  <Textarea
                    id="competitorNotes"
                    name="notes"
                    defaultValue={competitor?.notes ?? ""}
                    rows={4}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Threat level" htmlFor="threatLevel">
                    <NativeSelect
                      id="threatLevel"
                      name="threatLevel"
                      defaultValue={competitor?.threatLevel ?? "medium"}
                    >
                      <option value="low">Low — different buyer</option>
                      <option value="medium">Medium — overlapping attention</option>
                      <option value="high">High — competing for the same budget</option>
                    </NativeSelect>
                  </Field>
                  <Field label="Platforms" htmlFor="competitorPlatforms" optional hint="Comma separated.">
                    <Input id="competitorPlatforms" name="platforms" placeholder="linkedin, youtube" />
                  </Field>
                </div>
              </DialogBody>
              <DialogFooter>
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <SubmitButton variant="primary">{competitor ? "Save" : "Add"}</SubmitButton>
              </DialogFooter>
            </>
          )}
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}
