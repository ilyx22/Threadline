"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR, CellTitle } from "@/components/ui/table";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import { InquiryStageBadge } from "@/components/ui/status";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import {
  deleteInquiryAction,
  saveInquiryAction,
  setInquiryStageAction,
} from "@/lib/actions/pipeline";
import {
  ATTRIBUTION_CLASS_META,
  ATTRIBUTION_CLASS_OPTIONS,
  EVIDENCE_BASIS_OPTIONS,
  INQUIRY_STAGES,
  INQUIRY_STAGE_META,
  metaOf,
} from "@/lib/domain/enums";
import { money } from "@/lib/utils/format";
import { formatDate, toDateInput } from "@/lib/utils/dates";

export type InquiryView = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  stage: string;
  source: string;
  contentItemId: string | null;
  contentTitle: string | null;
  cta: string | null;
  leadMagnet: string | null;
  link: string | null;
  valueMinor: number;
  occurredAt: string;
  notes: string | null;
  attribution: string;
  evidenceBasis: string;
  evidenceSource: string | null;
};

export function PipelineTable({
  slug,
  inquiries,
  content,
  canEdit,
  currency,
}: {
  slug: string;
  inquiries: InquiryView[];
  content: { id: string; title: string }[];
  canEdit: boolean;
  currency: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<InquiryView | null>(null);
  const [pending, startTransition] = React.useTransition();

  const setStage = (inquiry: InquiryView, stage: string) => {
    startTransition(async () => {
      const result = await setInquiryStageAction(slug, inquiry.id, stage);
      if (result.ok) {
        toast.success(result.message ?? "Stage updated.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const remove = (inquiry: InquiryView) => {
    if (!window.confirm(`Delete the record for ${inquiry.name}?`)) return;
    startTransition(async () => {
      const result = await deleteInquiryAction(slug, inquiry.id);
      if (result.ok) {
        toast.success("Record deleted.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  if (inquiries.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-[13px] text-faint">
        No records match those filters.
      </p>
    );
  }

  return (
    <>
      <Table>
        <THead>
          <TR>
            <TH>Person</TH>
            <TH>Stage</TH>
            <TH>From content</TH>
            <TH>Value</TH>
            <TH>Date</TH>
            {canEdit ? <TH align="right">Actions</TH> : null}
          </TR>
        </THead>
        <TBody>
          {inquiries.map((inquiry) => (
            <TR key={inquiry.id}>
              <TD>
                <CellTitle secondary={inquiry.company ?? inquiry.email ?? undefined}>
                  {inquiry.name}
                </CellTitle>
              </TD>
              <TD>
                {canEdit ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button type="button" className="rounded" aria-label="Change stage">
                        <InquiryStageBadge stage={inquiry.stage} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuLabel>Move to</DropdownMenuLabel>
                      {INQUIRY_STAGES.filter((s) => s !== inquiry.stage).map((stage) => (
                        <DropdownMenuItem key={stage} onSelect={() => setStage(inquiry, stage)}>
                          {INQUIRY_STAGE_META[stage].label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <InquiryStageBadge stage={inquiry.stage} />
                )}
              </TD>
              <TD>
                {inquiry.contentItemId && inquiry.contentTitle ? (
                  <Link
                    href={`/app/${slug}/production/${inquiry.contentItemId}`}
                    className="inline-flex max-w-[16rem] items-center gap-1.5 truncate text-accent transition-colors hover:text-accent-bright"
                  >
                    <span className="truncate">{inquiry.contentTitle}</span>
                    <ExternalLink className="size-3 shrink-0" aria-hidden />
                  </Link>
                ) : (
                  <span className="text-ghost">Not attributed</span>
                )}
                {/*
                  The strength of the claim, always beside the claim. A link to
                  a piece of content without it reads as "this caused that",
                  which the evidence usually does not support.
                */}
                <Badge tone={metaOf(ATTRIBUTION_CLASS_META, inquiry.attribution).tone} className="mt-1.5">
                  {metaOf(ATTRIBUTION_CLASS_META, inquiry.attribution).label}
                </Badge>
              </TD>
              <TD className="tabular">
                {inquiry.valueMinor > 0 ? money(inquiry.valueMinor, currency) : "—"}
              </TD>
              <TD>{formatDate(inquiry.occurredAt, "short")}</TD>
              {canEdit ? (
                <TD align="right">
                  <div className="flex items-center justify-end gap-0.5">
                    <Button size="xs" variant="ghost" icon={Pencil} onClick={() => setEditing(inquiry)}>
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      icon={Trash2}
                      loading={pending}
                      onClick={() => remove(inquiry)}
                    >
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </TD>
              ) : null}
            </TR>
          ))}
        </TBody>
      </Table>

      {editing ? (
        <InquiryDialog
          slug={slug}
          inquiry={editing}
          content={content}
          currency={currency}
          open
          onOpenChange={(open) => !open && setEditing(null)}
        />
      ) : null}
    </>
  );
}

export function NewInquiryButton({
  slug,
  content,
}: {
  slug: string;
  content: { id: string; title: string }[];
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button icon={Plus} onClick={() => setOpen(true)}>
        Log an inquiry
      </Button>
      {open ? (
        <InquiryDialog
          slug={slug}
          inquiry={null}
          content={content}
          currency="GBP"
          open
          onOpenChange={setOpen}
        />
      ) : null}
    </>
  );
}

function InquiryDialog({
  slug,
  inquiry,
  content,
  currency,
  open,
  onOpenChange,
}: {
  slug: string;
  inquiry: InquiryView | null;
  content: { id: string; title: string }[];
  currency: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader
          title={inquiry ? "Edit record" : "Log an inquiry"}
          description="Link it to the piece that produced it — that link is what makes the attribution view worth anything."
        />
        <ActionForm
          action={saveInquiryAction.bind(null, slug, inquiry?.id ?? null)}
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Name" htmlFor="inquiryName" error={fieldErrors.name}>
                    <Input id="inquiryName" name="name" defaultValue={inquiry?.name} required autoFocus />
                  </Field>
                  <Field label="Company" htmlFor="inquiryCompany" optional>
                    <Input id="inquiryCompany" name="company" defaultValue={inquiry?.company ?? ""} />
                  </Field>
                  <Field label="Email" htmlFor="inquiryEmail" optional error={fieldErrors.email}>
                    <Input
                      id="inquiryEmail"
                      name="email"
                      type="email"
                      defaultValue={inquiry?.email ?? ""}
                    />
                  </Field>
                  <Field label="Date" htmlFor="occurredAt">
                    <Input
                      id="occurredAt"
                      name="occurredAt"
                      type="date"
                      defaultValue={toDateInput(inquiry?.occurredAt ?? new Date())}
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Stage" htmlFor="inquiryStage">
                    <NativeSelect id="inquiryStage" name="stage" defaultValue={inquiry?.stage ?? "inquiry"}>
                      {INQUIRY_STAGES.map((s) => (
                        <option key={s} value={s}>
                          {INQUIRY_STAGE_META[s].label}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Field label="Source" htmlFor="inquirySource">
                    <NativeSelect id="inquirySource" name="source" defaultValue={inquiry?.source ?? "content"}>
                      <option value="content">Content</option>
                      <option value="referral">Referral</option>
                      <option value="outbound">Outbound</option>
                      <option value="other">Other</option>
                    </NativeSelect>
                  </Field>
                </div>

                <Field
                  label="Attributed content"
                  htmlFor="contentItemId"
                  hint="Which published piece produced this conversation."
                  optional
                >
                  <NativeSelect
                    id="contentItemId"
                    name="contentItemId"
                    defaultValue={inquiry?.contentItemId ?? ""}
                  >
                    <option value="">Not attributed</option>
                    {content.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="CTA used" htmlFor="inquiryCta" optional>
                    <Input id="inquiryCta" name="cta" defaultValue={inquiry?.cta ?? ""} />
                  </Field>
                  <Field label={`Value (${currency})`} htmlFor="inquiryValue" optional>
                    <Input
                      id="inquiryValue"
                      name="value"
                      type="number"
                      min={0}
                      step="0.01"
                      defaultValue={inquiry ? inquiry.valueMinor / 100 : undefined}
                    />
                  </Field>
                </div>

                {/*
                  Attribution strength, recorded rather than implied. Linking an
                  inquiry to a piece of content is a claim about causality, and
                  organic content does not have paid-advertising certainty — so
                  the strength of the claim is stored beside it and every screen
                  reads the label from one place.
                */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="How strong is the link"
                    htmlFor="attribution"
                    hint={metaOf(ATTRIBUTION_CLASS_META, inquiry?.attribution ?? "qualitative_only").description}
                  >
                    <NativeSelect
                      id="attribution"
                      name="attribution"
                      defaultValue={inquiry?.attribution ?? "qualitative_only"}
                    >
                      {ATTRIBUTION_CLASS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Field label="Who observed it" htmlFor="evidenceBasis">
                    <NativeSelect
                      id="evidenceBasis"
                      name="evidenceBasis"
                      defaultValue={inquiry?.evidenceBasis ?? "client_reported"}
                    >
                      {EVIDENCE_BASIS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                </div>

                <Field
                  label="Evidence"
                  htmlFor="evidenceSource"
                  optional
                  hint="Where this came from: a tracked link, a booking answer, a CRM field, or what the buyer said."
                >
                  <Input
                    id="evidenceSource"
                    name="evidenceSource"
                    defaultValue={inquiry?.evidenceSource ?? ""}
                  />
                </Field>

                <Field label="Notes" htmlFor="inquiryNotes" optional>
                  <Textarea id="inquiryNotes" name="notes" defaultValue={inquiry?.notes ?? ""} rows={3} />
                </Field>
              </DialogBody>
              <DialogFooter>
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <SubmitButton variant="primary">{inquiry ? "Save" : "Log record"}</SubmitButton>
              </DialogFooter>
            </>
          )}
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}
