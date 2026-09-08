"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Link2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { ActionButton, ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import { CopyButton } from "@/components/ui/copy-button";
import {
  createTrackedLinkAction,
  recordCommercialEventAction,
  setTrackedLinkActiveAction,
} from "@/lib/actions/attribution";
import {
  ATTRIBUTION_CLASS_META,
  ATTRIBUTION_CLASS_OPTIONS,
  COMMERCIAL_EVENT_KIND_OPTIONS,
  EVENT_SOURCE_OPTIONS,
  EVIDENCE_BASIS_OPTIONS,
  metaOf,
} from "@/lib/domain/enums";
import type { ActionResult } from "@/lib/actions/shared";
import { toDateInput } from "@/lib/utils/dates";

type CreateLink = (prev: never, formData: FormData) => Promise<ActionResult<{ id: string; slug: string }>>;

/**
 * Creating a tracked link.
 *
 * The destination is validated on the server, not here — client-side checks are
 * a courtesy to the operator, never the control. What this form does care about
 * is attaching the link to a content item, because a link with no asset behind
 * it records clicks that can never be attributed to anything.
 */
export function NewLinkButton({
  slug,
  content,
}: {
  slug: string;
  content: { id: string; title: string }[];
}) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  return (
    <>
      <Button icon={Plus} onClick={() => setOpen(true)}>
        Tracked link
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader
            title="New tracked link"
            description="Threadline owns the URL, records the click, and sends the visitor on. This is what lets us measure content we did not publish."
          />
          <ActionForm
            action={createTrackedLinkAction.bind(null, slug) as CreateLink}
            onSuccess={() => {
              setOpen(false);
              router.refresh();
            }}
            className="contents"
          >
            {({ fieldErrors, error }) => (
              <>
                <DialogBody className="space-y-4">
                  <FormError error={error} />

                  <Field label="Name" htmlFor="label" error={fieldErrors.label}>
                    <Input
                      id="label"
                      name="label"
                      required
                      autoFocus
                      placeholder="e.g. Carve-out post, LinkedIn bio"
                    />
                  </Field>

                  <Field
                    label="Destination"
                    htmlFor="destinationUrl"
                    hint="Where the visitor actually ends up. Only http and https."
                    error={fieldErrors.destinationUrl}
                  >
                    <Input id="destinationUrl" name="destinationUrl" required placeholder="example.com/enquire" />
                  </Field>

                  <Field
                    label="Content"
                    htmlFor="contentItemId"
                    hint="A link with no asset behind it records clicks that can never be attributed."
                  >
                    <NativeSelect id="contentItemId" name="contentItemId" defaultValue="">
                      <option value="">Not attached</option>
                      {content.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Where it is placed" htmlFor="platform" optional>
                      <Input id="platform" name="platform" placeholder="e.g. LinkedIn caption" />
                    </Field>
                    <Field label="Campaign" htmlFor="campaign" optional>
                      <Input id="campaign" name="campaign" />
                    </Field>
                  </div>
                </DialogBody>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <SubmitButton variant="primary">Create</SubmitButton>
                </DialogFooter>
              </>
            )}
          </ActionForm>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function LinkRow({
  slug,
  link,
  origin,
}: {
  slug: string;
  link: {
    id: string;
    slug: string;
    label: string;
    destinationUrl: string;
    active: boolean;
    clicks: number;
    contentTitle: string | null;
    platform: string | null;
  };
  origin: string;
}) {
  const router = useRouter();
  const url = `${origin}/t/${link.slug}`;

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-ink">{link.label}</p>
        <p className="truncate text-[11.5px] text-faint">
          {link.contentTitle ?? "No asset attached"}
          {link.platform ? ` · ${link.platform}` : ""} · goes to {link.destinationUrl}
        </p>
      </div>

      <code className="rounded bg-raised px-2 py-1 text-[11.5px] text-muted">/t/{link.slug}</code>
      <CopyButton value={url} label="Copy link" />

      <span className="w-16 shrink-0 text-right text-[12px] tabular text-muted">
        {link.clicks} {link.clicks === 1 ? "click" : "clicks"}
      </span>

      <ActionButton
        size="xs"
        variant="ghost"
        action={() => setTrackedLinkActiveAction(slug, link.id, !link.active)}
        onDone={() => router.refresh()}
        confirm={
          link.active
            ? "Retire this link? Past clicks are kept; new ones stop being recorded and the URL stops redirecting."
            : undefined
        }
      >
        {link.active ? "Retire" : "Re-enable"}
      </ActionButton>
    </div>
  );
}

/**
 * Recording a commercial event.
 *
 * The evidence class is a required choice rather than a default, because it is
 * the field that decides whether a number may later be described as caused by
 * content. Nothing in the system infers it.
 */
export function RecordEventButton({
  slug,
  inquiries,
}: {
  slug: string;
  inquiries: { id: string; label: string }[];
}) {
  const [open, setOpen] = React.useState(false);
  const [evidence, setEvidence] = React.useState("qualitative_only");
  const router = useRouter();
  const meta = metaOf(ATTRIBUTION_CLASS_META, evidence);

  return (
    <>
      <Button icon={Link2} variant="secondary" onClick={() => setOpen(true)}>
        Record event
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="lg">
          <DialogHeader
            title="Record a commercial event"
            description="One dated thing that happened, with where it came from and how strongly it connects to content."
          />
          <ActionForm
            action={recordCommercialEventAction.bind(null, slug)}
            onSuccess={() => {
              setOpen(false);
              router.refresh();
            }}
            className="contents"
          >
            {({ fieldErrors, error }) => (
              <>
                <DialogBody className="space-y-4">
                  <FormError error={error} />

                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="What happened" htmlFor="kind" error={fieldErrors.kind}>
                      <NativeSelect id="kind" name="kind" defaultValue="inquiry">
                        {COMMERCIAL_EVENT_KIND_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                    <Field label="When" htmlFor="occurredAt">
                      <Input
                        id="occurredAt"
                        name="occurredAt"
                        type="date"
                        defaultValue={toDateInput(new Date())}
                      />
                    </Field>
                    <Field label="Value" htmlFor="value" optional>
                      <Input id="value" name="value" type="number" min={0} step="0.01" defaultValue={0} />
                    </Field>
                  </div>

                  <Field label="Person" htmlFor="inquiryId" optional>
                    <NativeSelect id="inquiryId" name="inquiryId" defaultValue="">
                      <option value="">Not linked to a record</option>
                      {inquiries.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.label}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Where it came from" htmlFor="source">
                      <NativeSelect id="source" name="source" defaultValue="manual">
                        {EVENT_SOURCE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                    <Field label="Observed or told" htmlFor="evidenceBasis">
                      <NativeSelect id="evidenceBasis" name="evidenceBasis" defaultValue="client_reported">
                        {EVIDENCE_BASIS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                  </div>

                  <Field
                    label="How strongly does this connect to content"
                    htmlFor="attribution"
                    hint={meta.description}
                  >
                    <NativeSelect
                      id="attribution"
                      name="attribution"
                      value={evidence}
                      onChange={(e) => setEvidence(e.target.value)}
                    >
                      {ATTRIBUTION_CLASS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="External system" htmlFor="externalProvider" optional>
                      <Input id="externalProvider" name="externalProvider" placeholder="Attio" />
                    </Field>
                    <Field label="Record id" htmlFor="externalRecordId" optional>
                      <Input id="externalRecordId" name="externalRecordId" />
                    </Field>
                    <Field label="Record URL" htmlFor="externalRecordUrl" optional>
                      <Input id="externalRecordUrl" name="externalRecordUrl" />
                    </Field>
                  </div>

                  <Field
                    label="Where this came from"
                    htmlFor="note"
                    hint="A figure entered by hand needs a note saying where it came from, or it is a number nobody can check."
                  >
                    <Textarea id="note" name="note" rows={3} />
                  </Field>
                </DialogBody>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <SubmitButton variant="primary">Record</SubmitButton>
                </DialogFooter>
              </>
            )}
          </ActionForm>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Switch between the three models. A URL parameter, so the view is shareable. */
export function ModelSwitch({
  slug,
  current,
  options,
}: {
  slug: string;
  current: string;
  options: { value: string; label: string }[];
}) {
  const router = useRouter();
  return (
    <NativeSelect
      value={current}
      onChange={(e) => router.push(`/app/${slug}/performance/attribution?model=${e.target.value}`)}
      className="w-auto"
      aria-label="Attribution model"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </NativeSelect>
  );
}
