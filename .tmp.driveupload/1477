"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Pencil, Plus, Trash2, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { CheckboxField } from "@/components/ui/controls";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { IssueStatusBadge, SeverityBadge } from "@/components/ui/status";
import { ActionButton, ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import { deleteSupportIssueAction, saveSupportIssueAction } from "@/lib/actions/admin";
import { ISSUE_STATUSES, ISSUE_STATUS_META, SEVERITIES, SEVERITY_META } from "@/lib/domain/enums";
import { relativeTime } from "@/lib/utils/dates";

type Issue = {
  id: string;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  orgId: string | null;
  orgName: string | null;
  ownerId: string | null;
  ownerName: string | null;
  resolution: string | null;
  becomesSop: boolean;
  becomesFix: boolean;
  createdAt: string;
  resolvedAt: string | null;
};

type Option = { id: string; name: string };

export function IssueBoard({
  issues,
  clients,
  owners,
}: {
  issues: Issue[];
  clients: Option[];
  owners: Option[];
}) {
  const [editing, setEditing] = React.useState<Issue | null>(null);

  return (
    <>
      <ul className="space-y-3">
        {issues.map((issue) => (
          <li key={issue.id}>
            <Card className={issue.status === "resolved" ? "opacity-75" : undefined}>
              <CardBody className="pt-4">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium leading-snug text-ink">{issue.title}</p>
                    <p className="mt-1 text-[11.5px] text-ghost">
                      {issue.orgName ?? "Platform-wide"}
                      {issue.ownerName ? ` · ${issue.ownerName}` : " · unowned"} ·{" "}
                      {relativeTime(new Date(issue.createdAt))}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <SeverityBadge severity={issue.severity} />
                    <IssueStatusBadge status={issue.status} />
                    <Button size="xs" variant="ghost" icon={Pencil} onClick={() => setEditing(issue)}>
                      <span className="sr-only">Edit</span>
                    </Button>
                    <ActionButton
                      size="xs"
                      variant="ghost"
                      icon={Trash2}
                      action={() => deleteSupportIssueAction(issue.id)}
                      confirm={`Delete "${issue.title}"?`}
                    >
                      <span className="sr-only">Delete</span>
                    </ActionButton>
                  </div>
                </div>

                {issue.description ? (
                  <p className="mt-2.5 text-[12.5px] leading-relaxed text-muted">
                    {issue.description}
                  </p>
                ) : null}

                {issue.resolution ? (
                  <div className="mt-3 rounded-md border border-positive/25 bg-positive-soft p-3">
                    <p className="text-eyebrow mb-1 text-positive">Resolution</p>
                    <p className="text-[12.5px] leading-relaxed text-muted">{issue.resolution}</p>
                  </div>
                ) : null}

                {issue.becomesSop || issue.becomesFix ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {issue.becomesSop ? (
                      <Badge tone="info" icon={BookOpen}>
                        Should become an SOP
                      </Badge>
                    ) : null}
                    {issue.becomesFix ? (
                      <Badge tone="accent" icon={Wrench}>
                        Should become a product fix
                      </Badge>
                    ) : null}
                  </div>
                ) : null}
              </CardBody>
            </Card>
          </li>
        ))}
      </ul>

      {editing ? (
        <IssueDialog
          issue={editing}
          clients={clients}
          owners={owners}
          open
          onOpenChange={(open) => !open && setEditing(null)}
        />
      ) : null}
    </>
  );
}

export function NewIssueButton({ clients, owners }: { clients: Option[]; owners: Option[] }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button icon={Plus} onClick={() => setOpen(true)}>
        Log an issue
      </Button>
      {open ? (
        <IssueDialog issue={null} clients={clients} owners={owners} open onOpenChange={setOpen} />
      ) : null}
    </>
  );
}

function IssueDialog({
  issue,
  clients,
  owners,
  open,
  onOpenChange,
}: {
  issue: Issue | null;
  clients: Option[];
  owners: Option[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [becomesSop, setBecomesSop] = React.useState(issue?.becomesSop ?? false);
  const [becomesFix, setBecomesFix] = React.useState(issue?.becomesFix ?? false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader
          title={issue ? "Edit issue" : "Log an issue"}
          description="Record the steps that reproduce it. An issue nobody can reproduce cannot be fixed."
        />
        <ActionForm
          action={saveSupportIssueAction.bind(null, issue?.id ?? null)}
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
                <Field label="Issue" htmlFor="issueTitle" error={fieldErrors.title}>
                  <Input id="issueTitle" name="title" defaultValue={issue?.title} required autoFocus />
                </Field>
                <Field label="Description" htmlFor="issueDescription" hint="What happened, and how to reproduce it.">
                  <Textarea
                    id="issueDescription"
                    name="description"
                    defaultValue={issue?.description ?? ""}
                    rows={4}
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Severity" htmlFor="issueSeverity">
                    <NativeSelect
                      id="issueSeverity"
                      name="severity"
                      defaultValue={issue?.severity ?? "medium"}
                    >
                      {SEVERITIES.map((s) => (
                        <option key={s} value={s}>
                          {SEVERITY_META[s].label}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Field label="Status" htmlFor="issueStatus">
                    <NativeSelect id="issueStatus" name="status" defaultValue={issue?.status ?? "open"}>
                      {ISSUE_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {ISSUE_STATUS_META[s].label}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Field label="Client" htmlFor="issueOrg" optional>
                    <NativeSelect id="issueOrg" name="orgId" defaultValue={issue?.orgId ?? ""}>
                      <option value="">Platform-wide</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Field label="Owner" htmlFor="issueOwner" optional>
                    <NativeSelect id="issueOwner" name="ownerId" defaultValue={issue?.ownerId ?? ""}>
                      <option value="">Unowned</option>
                      {owners.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                </div>

                <Field
                  label="Resolution"
                  htmlFor="issueResolution"
                  hint="What actually fixed it. Required in practice before marking resolved."
                  optional
                >
                  <Textarea
                    id="issueResolution"
                    name="resolution"
                    defaultValue={issue?.resolution ?? ""}
                    rows={3}
                  />
                </Field>

                <div className="space-y-3 rounded-lg border border-line bg-surface p-4">
                  <p className="text-[13px] font-medium text-ink">Should this change something?</p>
                  <p className="text-[12px] leading-relaxed text-muted">
                    Anything solved twice should become an SOP or a product fix. Solving it a third
                    time manually is a failure of this process.
                  </p>
                  <CheckboxField
                    id="becomesSop"
                    name="becomesSop"
                    value="on"
                    label="Should become an SOP"
                    checked={becomesSop}
                    onCheckedChange={(c) => setBecomesSop(c === true)}
                  />
                  {becomesSop ? <input type="hidden" name="becomesSop" value="on" /> : null}
                  <CheckboxField
                    id="becomesFix"
                    name="becomesFix"
                    value="on"
                    label="Should become a product fix"
                    checked={becomesFix}
                    onCheckedChange={(c) => setBecomesFix(c === true)}
                  />
                  {becomesFix ? <input type="hidden" name="becomesFix" value="on" /> : null}
                </div>
              </DialogBody>
              <DialogFooter>
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <SubmitButton variant="primary">{issue ? "Save issue" : "Log issue"}</SubmitButton>
              </DialogFooter>
            </>
          )}
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}
