"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, ExternalLink, List, Plus, Send } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Badge, Pill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/controls";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR, CellTitle } from "@/components/ui/table";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Notice } from "@/components/ui/feedback";
import { PublishStatusBadge } from "@/components/ui/status";
import { toast } from "@/components/ui/toast";
import { ActionButton, ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import {
  createPublishRecordAction,
  resolveUncertainPublishAction,
  deletePublishRecordAction,
  updatePublishRecordAction,
} from "@/lib/actions/distribution";
import { PLATFORM_META, PLATFORM_OPTIONS, metaOf } from "@/lib/domain/enums";
import { compactNumber } from "@/lib/utils/format";
import { formatDate, isSameDay, toDateInput } from "@/lib/utils/dates";

type RecordView = {
  id: string;
  contentItemId: string;
  title: string;
  platform: string;
  status: string;
  method: string;
  scheduledFor: string | null;
  publishedAt: string | null;
  url: string | null;
  accountHandle: string | null;
  hasPackage: boolean;
  views: number | null;
  providerStatus?: string | null;
  failureReason?: string | null;
};

/** INT-03/JOB-02: the platform may or may not have posted; a person checks and says which. */
function UncertainResolver({ slug, recordId }: { slug: string; recordId: string }) {
  const router = useRouter();
  const [url, setUrl] = React.useState("");
  return (
    <div className="mt-1 max-w-[18rem] space-y-1 text-[11px] text-ghost">
      <p>No answer from the platform. Check the account: did it post?</p>
      <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Post URL, if it posted" className="w-full rounded border border-line bg-transparent px-1.5 py-0.5 text-[11px]" aria-label="Post URL" />
      <div className="flex gap-1">
        <ActionButton size="xs" variant="ghost" disabled={!url.trim()} action={() => resolveUncertainPublishAction(slug, recordId, url.trim())} onDone={() => router.refresh()}>
          It posted
        </ActionButton>
        <ActionButton size="xs" variant="ghost" action={() => resolveUncertainPublishAction(slug, recordId, null)} onDone={() => router.refresh()} confirm="Send it again now?">
          It did not; send again
        </ActionButton>
      </div>
    </div>
  );
}

export function DistributionView({
  slug,
  canEdit,
  canPublish,
  month,
  monthLabel,
  calendar,
  records,
  queue,
  accounts,
}: {
  slug: string;
  canEdit: boolean;
  canPublish: boolean;
  month: string;
  monthLabel: string;
  calendar: {
    date: string;
    inMonth: boolean;
    records: { id: string; title: string; contentItemId: string; platform: string; status: string }[];
  }[];
  records: RecordView[];
  queue: { id: string; title: string; platform: string; packages: string[] }[];
  accounts: { id: string; platform: string; handle: string; isConnected: boolean }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = React.useState<"calendar" | "list">("calendar");
  const [publishing, setPublishing] = React.useState<RecordView | null>(null);
  const [scheduling, setScheduling] = React.useState<{ id: string; title: string; platform: string } | null>(
    null,
  );

  const shiftMonth = (delta: number) => {
    const [year, m] = month.split("-").map(Number);
    const date = new Date(year ?? 2026, (m ?? 1) - 1 + delta, 1);
    const next = new URLSearchParams(searchParams.toString());
    next.set("month", `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
    router.replace(`?${next.toString()}`, { scroll: false });
  };

  const today = new Date();

  return (
    <div className="space-y-6">
      {queue.length > 0 && canEdit ? (
        <Card accent>
          <CardHeader
            title={`${queue.length} approved ${queue.length === 1 ? "piece" : "pieces"} ready to schedule`}
            eyebrow="Scheduling queue"
          />
          <CardBody className="pt-0">
            <ul className="divide-y divide-line">
              {queue.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center gap-3 py-2.5">
                  <Link
                    href={`/app/${slug}/production/${item.id}`}
                    className="min-w-0 flex-1 truncate text-[13px] text-ink transition-colors hover:text-accent"
                  >
                    {item.title}
                  </Link>
                  {item.packages.length === 0 ? (
                    <Badge tone="warning">Not packaged</Badge>
                  ) : (
                    item.packages.map((p) => (
                      <Pill key={p}>{metaOf(PLATFORM_META, p).label}</Pill>
                    ))
                  )}
                  <Button
                    size="xs"
                    variant="secondary"
                    icon={Plus}
                    onClick={() =>
                      setScheduling({ id: item.id, title: item.title, platform: item.platform })
                    }
                  >
                    Schedule
                  </Button>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" icon={ChevronLeft} onClick={() => shiftMonth(-1)}>
            <span className="sr-only">Previous month</span>
          </Button>
          <span className="min-w-[9rem] text-center text-[13px] font-medium text-ink">
            {monthLabel}
          </span>
          <Button size="sm" variant="ghost" icon={ChevronRight} onClick={() => shiftMonth(1)}>
            <span className="sr-only">Next month</span>
          </Button>
        </div>
        <SegmentedControl
          value={view}
          onValueChange={setView}
          size="sm"
          options={[
            { value: "calendar", label: "Calendar", icon: CalendarDays },
            { value: "list", label: "List", icon: List },
          ]}
        />
      </div>

      {view === "calendar" ? (
        <div className="overflow-hidden rounded-lg border border-line bg-elevated">
          <div className="grid grid-cols-7 border-b border-line bg-surface/60">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div key={day} className="text-eyebrow px-2 py-2 text-center text-ghost">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendar.map((cell) => {
              const date = new Date(cell.date);
              const isToday = isSameDay(date, today);
              return (
                <div
                  key={cell.date}
                  className={cn(
                    "min-h-[6.5rem] border-b border-r border-line p-1.5 last:border-r-0",
                    !cell.inMonth && "bg-surface/30",
                  )}
                >
                  <div className="mb-1 flex items-center justify-between px-0.5">
                    <span
                      className={cn(
                        "text-[11px] tabular",
                        isToday
                          ? "rounded bg-accent px-1.5 py-0.5 font-medium text-[color:var(--color-base)]"
                          : cell.inMonth
                            ? "text-muted"
                            : "text-ghost",
                      )}
                    >
                      {date.getDate()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {cell.records.slice(0, 3).map((record) => (
                      <Link
                        key={record.id}
                        href={`/app/${slug}/production/${record.contentItemId}`}
                        className={cn(
                          "block truncate rounded px-1.5 py-1 text-[10.5px] leading-tight transition-colors",
                          record.status === "published"
                            ? "bg-accent-soft text-accent hover:bg-[rgba(200,169,107,0.2)]"
                            : "bg-raised text-muted hover:bg-line-strong",
                        )}
                        title={record.title}
                      >
                        {record.title}
                      </Link>
                    ))}
                    {cell.records.length > 3 ? (
                      <p className="px-1.5 text-[10px] text-ghost">
                        +{cell.records.length - 3} more
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Content</TH>
              <TH>Platform</TH>
              <TH>Status</TH>
              <TH>Date</TH>
              <TH>Views</TH>
              <TH align="right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {records.length === 0 ? (
              <TR>
                <TD colSpan={6} align="center" className="py-8 text-faint">
                  No publish records match those filters.
                </TD>
              </TR>
            ) : (
              records.map((record) => (
                <TR key={record.id} interactive>
                  <TD>
                    <Link href={`/app/${slug}/production/${record.contentItemId}`}>
                      <CellTitle secondary={record.accountHandle ?? undefined}>
                        {record.title}
                      </CellTitle>
                    </Link>
                  </TD>
                  <TD>{metaOf(PLATFORM_META, record.platform).label}</TD>
                  <TD>
                    <PublishStatusBadge status={record.status} />
                    {record.providerStatus === "UNCERTAIN" && canPublish ? <UncertainResolver slug={slug} recordId={record.id} /> : record.failureReason && record.status === "failed" ? <p className="mt-1 max-w-[16rem] text-[11px] text-ghost">{record.failureReason}</p> : null}
                  </TD>
                  <TD>
                    {record.publishedAt
                      ? formatDate(record.publishedAt, "short")
                      : record.scheduledFor
                        ? formatDate(record.scheduledFor, "short")
                        : "—"}
                  </TD>
                  <TD className="tabular">
                    {record.views != null ? compactNumber(record.views) : "—"}
                  </TD>
                  <TD align="right">
                    <div className="flex items-center justify-end gap-1">
                      {record.url ? (
                        <a
                          href={record.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="rounded p-1.5 text-ghost transition-colors hover:text-muted"
                          aria-label="Open live post"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      ) : null}
                      {canPublish && record.status !== "published" ? (
                        <Button size="xs" variant="secondary" onClick={() => setPublishing(record)}>
                          Mark live
                        </Button>
                      ) : null}
                      {canEdit && record.status !== "published" ? (
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={async () => {
                            if (!window.confirm("Remove this publish record?")) return;
                            const result = await deletePublishRecordAction(slug, record.id);
                            if (result.ok) {
                              toast.success("Publish record removed.");
                              router.refresh();
                            } else {
                              toast.error(result.error);
                            }
                          }}
                        >
                          Remove
                        </Button>
                      ) : null}
                    </div>
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      )}

      {accounts.length > 0 ? (
        <Card>
          <CardHeader
            title="Destinations"
            eyebrow="Accounts"
            description="Where content goes. None are connected — these label the destination for manual publishing."
          />
          <CardBody className="pt-0">
            <div className="flex flex-wrap gap-2">
              {accounts.map((account) => (
                <span
                  key={account.id}
                  className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-1.5 text-[12.5px] text-muted"
                >
                  {metaOf(PLATFORM_META, account.platform).label}
                  <span className="text-ghost">{account.handle}</span>
                  <Badge tone={account.isConnected ? "positive" : "outline"}>
                    {account.isConnected ? "Connected" : "Manual"}
                  </Badge>
                </span>
              ))}
            </div>
          </CardBody>
        </Card>
      ) : null}

      {/* ------------------------------ Mark live -------------------------------- */}
      <Dialog open={Boolean(publishing)} onOpenChange={(open) => !open && setPublishing(null)}>
        <DialogContent>
          <DialogHeader
            title="Mark published"
            description="Paste the live URL. Without it, performance cannot be tracked and inbound cannot be attributed — so the system requires it."
          />
          {publishing ? (
            <ActionForm
              action={updatePublishRecordAction.bind(null, slug, publishing.id)}
              onSuccess={() => {
                setPublishing(null);
                router.refresh();
              }}
              className="contents"
            >
              {({ error }) => (
                <>
                  <DialogBody className="space-y-4">
                    <FormError error={error} />
                    <input type="hidden" name="status" value="published" />
                    <p className="text-[13px] text-muted">{publishing.title}</p>
                    <Field label="Live URL" htmlFor="liveUrl">
                      <Input
                        id="liveUrl"
                        name="url"
                        type="url"
                        required
                        autoFocus
                        placeholder="https://www.linkedin.com/posts/…"
                        defaultValue={publishing.url ?? ""}
                      />
                    </Field>
                  </DialogBody>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setPublishing(null)}>
                      Cancel
                    </Button>
                    <SubmitButton variant="accent" icon={Send}>
                      Mark live
                    </SubmitButton>
                  </DialogFooter>
                </>
              )}
            </ActionForm>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ------------------------------- Schedule -------------------------------- */}
      <Dialog open={Boolean(scheduling)} onOpenChange={(open) => !open && setScheduling(null)}>
        <DialogContent>
          <DialogHeader title="Schedule for publishing" description={scheduling?.title} />
          {scheduling ? (
            <ActionForm
              action={createPublishRecordAction.bind(null, slug)}
              onSuccess={() => {
                setScheduling(null);
                router.refresh();
              }}
              className="contents"
            >
              {({ error }) => (
                <>
                  <DialogBody className="space-y-4">
                    <FormError error={error} />
                    <input type="hidden" name="contentItemId" value={scheduling.id} />
                    <Field label="Platform" htmlFor="schedulePlatform">
                      <NativeSelect
                        id="schedulePlatform"
                        name="platform"
                        defaultValue={scheduling.platform}
                      >
                        {PLATFORM_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                    <Field label="Distribution" htmlFor="distributionMode" hint="Paid amplification is recorded so organic and paid reach are never mixed.">
                      <NativeSelect id="distributionMode" name="distributionMode" defaultValue="organic">
                        <option value="organic">Organic</option>
                        <option value="paid_amplified">Paid amplification</option>
                      </NativeSelect>
                    </Field>
                    <Field label="How it goes out" htmlFor="publishMethod" hint="Through the connected account needs the platform connected and a publish time; it is re-checked for approval at that time.">
                      <NativeSelect id="publishMethod" name="method" defaultValue="manual">
                        <option value="manual">Posted by a person</option>
                        <option value="integration">Through the connected account</option>
                      </NativeSelect>
                    </Field>
                    <Field
                      label="Publish date"
                      htmlFor="scheduledFor"
                      hint="Leave blank to keep it as a draft record."
                      optional
                    >
                      <Input
                        id="scheduledFor"
                        name="scheduledFor"
                        type="date"
                        defaultValue={toDateInput(new Date())}
                      />
                    </Field>
                    {accounts.length > 0 ? (
                      <Field label="Account" htmlFor="accountId" optional>
                        <NativeSelect id="accountId" name="accountId" defaultValue="">
                          <option value="">No specific account</option>
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {metaOf(PLATFORM_META, a.platform).label} · {a.handle}
                            </option>
                          ))}
                        </NativeSelect>
                      </Field>
                    ) : null}
                    <Notice tone="neutral">
                      Scheduling here records the plan. Publishing itself is manual — Threadline
                      cannot post on your behalf without platform credentials.
                    </Notice>
                  </DialogBody>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setScheduling(null)}>
                      Cancel
                    </Button>
                    <SubmitButton variant="primary">Schedule</SubmitButton>
                  </DialogFooter>
                </>
              )}
            </ActionForm>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
