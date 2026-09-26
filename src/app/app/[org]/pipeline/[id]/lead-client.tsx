"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { ActionButton, ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import {
  addLeadMessageAction,
  approveDraftAction,
  assignLeadAction,
  discardDraftAction,
  draftReplyAction,
  markSentAction,
  qualifyLeadAction,
  setFollowUpAction,
} from "@/lib/actions/leads";

type Props = {
  slug: string;
  canEdit: boolean;
  lead: { id: string; ownerId: string | null; followUpAt: string | null; firstResponseAt: string | null; occurredAt: string };
  members: { id: string; name: string }[];
  messages: { id: string; direction: string; body: string; at: string }[];
  qualification: { criterion: string; note: string; at: string }[];
  drafts: { id: string; body: string; status: string; generatedBy: string; isDemo: boolean }[];
};

const CRITERIA = ["fit", "need", "authority", "budget", "timing", "location"];
const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

export function LeadWorkbench({ slug, canEdit, lead, members, messages, qualification, drafts }: Props) {
  const router = useRouter();
  const refresh = () => router.refresh();
  const [criterion, setCriterion] = React.useState("fit");
  const [note, setNote] = React.useState("");
  const [edits, setEdits] = React.useState<Record<string, string>>({});

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <Card>
          <CardHeader title="Thread" description={lead.firstResponseAt ? `First reply ${when(lead.firstResponseAt)}` : "No reply recorded yet."} />
          <CardBody className="space-y-3 pt-0">
            {messages.length === 0 ? <p className="text-[13px] text-muted">No message text recorded.</p> : null}
            {messages.map((m) => (
              <div key={m.id} className={`rounded-md border border-line px-3 py-2 text-[13px] ${m.direction === "out" ? "ml-8 bg-surface" : "mr-8"}`}>
                <p className="mb-1 text-[11px] text-faint">
                  {m.direction === "out" ? "Us" : "Them"} · {when(m.at)}
                </p>
                <p className="whitespace-pre-wrap text-ink">{m.body}</p>
              </div>
            ))}
            {canEdit ? (
              <ActionForm action={addLeadMessageAction.bind(null, slug, lead.id)} onSuccess={refresh} className="space-y-2 border-t border-line pt-3">
                {({ error }) => (
                  <>
                    <FormError error={error} />
                    <Textarea name="body" rows={2} placeholder="Record a message sent or received elsewhere" />
                    <div className="flex items-center gap-2">
                      <NativeSelect name="direction" defaultValue="in" aria-label="Direction">
                        <option value="in">From them</option>
                        <option value="out">From us</option>
                      </NativeSelect>
                      <SubmitButton size="sm" pendingLabel="Saving…">
                        Add
                      </SubmitButton>
                    </div>
                  </>
                )}
              </ActionForm>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Reply" description="Drafted for you to check, edit and send yourself. Nothing is sent from here." />
          <CardBody className="space-y-4 pt-0">
            {drafts.map((d) => (
              <div key={d.id} className="space-y-2 rounded-md border border-line p-3">
                <p className="text-[11px] text-faint">
                  {d.status === "draft" ? "Draft" : d.status === "approved" ? "Approved, not yet sent" : "Sent"}
                  {d.generatedBy === "ai" ? (d.isDemo ? " · demo text (no AI key configured)" : " · drafted by AI") : ""}
                </p>
                {d.status === "draft" && canEdit ? (
                  <Textarea rows={5} value={edits[d.id] ?? d.body} onChange={(e) => setEdits({ ...edits, [d.id]: e.target.value })} aria-label="Reply text" />
                ) : (
                  <p className="whitespace-pre-wrap text-[13px] text-ink">{d.body}</p>
                )}
                {canEdit ? (
                  <div className="flex flex-wrap gap-2">
                    {d.status === "draft" ? (
                      <ActionButton size="sm" icon={Check} action={() => approveDraftAction(slug, lead.id, d.id, edits[d.id] ?? d.body)} onDone={refresh}>
                        Approve
                      </ActionButton>
                    ) : null}
                    {d.status === "approved" ? (
                      <ActionButton size="sm" icon={Send} action={() => markSentAction(slug, lead.id, d.id)} onDone={refresh} confirm="Mark as sent? Only do this once you have sent it yourself.">
                        I sent it
                      </ActionButton>
                    ) : null}
                    {d.status !== "sent" ? (
                      <ActionButton size="sm" variant="ghost" icon={X} action={() => discardDraftAction(slug, lead.id, d.id)} onDone={refresh}>
                        Discard
                      </ActionButton>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
            {canEdit ? (
              <ActionButton icon={Sparkles} action={() => draftReplyAction(slug, lead.id)} onDone={refresh}>
                Draft a reply
              </ActionButton>
            ) : null}
          </CardBody>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader title="Owner and follow-up" />
          <CardBody className="space-y-3 pt-0">
            <Field label="Owner" htmlFor="leadOwner">
              <NativeSelect id="leadOwner" disabled={!canEdit} defaultValue={lead.ownerId ?? ""} onChange={async (e) => { await assignLeadAction(slug, lead.id, e.target.value || null); refresh(); }}>
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Follow up on" htmlFor="leadFollow" hint="The owner gets a task on the day.">
              <Input id="leadFollow" type="date" disabled={!canEdit} defaultValue={lead.followUpAt ?? ""} onChange={async (e) => { await setFollowUpAction(slug, lead.id, e.target.value || null); refresh(); }} />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Qualification" description="What was actually established. Location alone does not qualify anyone." />
          <CardBody className="space-y-3 pt-0">
            {qualification.length ? (
              <ul className="space-y-1.5 text-[12.5px]">
                {qualification.map((q, i) => (
                  <li key={i}>
                    <span className="font-medium text-ink">{q.criterion}</span>: <span className="text-muted">{q.note}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[12.5px] text-muted">Nothing recorded yet.</p>
            )}
            {canEdit ? (
              <div className="space-y-2 border-t border-line pt-3">
                <NativeSelect value={criterion} onChange={(e) => setCriterion(e.target.value)} aria-label="Criterion">
                  {CRITERIA.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </NativeSelect>
                <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What you established" aria-label="Evidence" />
                <ActionButton
                  size="sm"
                  action={() => qualifyLeadAction(slug, lead.id, [{ criterion, note }])}
                  onDone={() => {
                    setNote("");
                    refresh();
                  }}
                >
                  Record
                </ActionButton>
              </div>
            ) : null}
          </CardBody>
        </Card>
        <Button variant="ghost" onClick={() => router.push(`/app/${slug}/pipeline`)}>
          Back to pipeline
        </Button>
      </div>
    </div>
  );
}
