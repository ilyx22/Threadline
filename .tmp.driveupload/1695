"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/controls";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect } from "@/components/ui/input";
import { Notice } from "@/components/ui/feedback";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import { toast } from "@/components/ui/toast";
import { addPerformanceSnapshotAction, deriveLearningsAction } from "@/lib/actions/performance";
import { PLATFORM_META, metaOf } from "@/lib/domain/enums";
import { formatDate } from "@/lib/utils/dates";

/**
 * Period selector plus the two write paths into performance: manual metric
 * entry, and deriving learnings back into the Signal engine.
 */
export function PerformanceControls({
  slug,
  days,
  isLive,
  canEdit,
  canDerive,
  records,
}: {
  slug: string;
  days: number;
  isLive: boolean;
  canEdit: boolean;
  canDerive: boolean;
  records: { id: string; title: string; platform: string; publishedAt: string | null }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [entryOpen, setEntryOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const setDays = (value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("days", value);
    router.replace(`?${next.toString()}`, { scroll: false });
  };

  const derive = () => {
    startTransition(async () => {
      const result = await deriveLearningsAction(slug, days);
      if (result.ok) {
        toast.success(result.message ?? "Detection complete.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <SegmentedControl
        value={String(days)}
        onValueChange={setDays}
        size="sm"
        options={[
          { value: "7", label: "7d" },
          { value: "30", label: "30d" },
          { value: "90", label: "90d" },
        ]}
      />

      {canEdit ? (
        <Button variant="secondary" icon={Plus} onClick={() => setEntryOpen(true)}>
          Record metrics
        </Button>
      ) : null}

      {canDerive ? (
        <Button variant="accent" icon={Sparkles} loading={pending} onClick={derive}>
          Derive learnings
        </Button>
      ) : null}

      <Dialog open={entryOpen} onOpenChange={setEntryOpen}>
        <DialogContent size="lg">
          <DialogHeader
            title="Record performance"
            description="Enter the current figures from the platform. Each entry is a new reading, so trends over time are preserved."
          />
          <ActionForm
            action={addPerformanceSnapshotAction.bind(null, slug)}
            onSuccess={() => {
              setEntryOpen(false);
              router.refresh();
            }}
            className="contents"
          >
            {({ error }) => (
              <>
                <DialogBody className="space-y-4">
                  <FormError error={error} />

                  {records.length === 0 ? (
                    <Notice tone="warning" title="Nothing published yet">
                      Mark a piece live in Distribution with its URL before recording performance.
                    </Notice>
                  ) : (
                    <>
                      <Field label="Published piece" htmlFor="publishRecordId">
                        <NativeSelect id="publishRecordId" name="publishRecordId" required>
                          {records.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.title} · {metaOf(PLATFORM_META, r.platform).label}
                              {r.publishedAt ? ` · ${formatDate(r.publishedAt, "short")}` : ""}
                            </option>
                          ))}
                        </NativeSelect>
                      </Field>

                      <div className="grid gap-4 sm:grid-cols-3">
                        <Field label="Views" htmlFor="views">
                          <Input id="views" name="views" type="number" min={0} defaultValue={0} />
                        </Field>
                        <Field label="Impressions" htmlFor="impressions" optional>
                          <Input id="impressions" name="impressions" type="number" min={0} />
                        </Field>
                        <Field label="Reach" htmlFor="reach" optional>
                          <Input id="reach" name="reach" type="number" min={0} />
                        </Field>
                        <Field label="Likes" htmlFor="likes" optional>
                          <Input id="likes" name="likes" type="number" min={0} />
                        </Field>
                        <Field label="Comments" htmlFor="comments" optional>
                          <Input id="comments" name="comments" type="number" min={0} />
                        </Field>
                        <Field label="Shares" htmlFor="shares" optional>
                          <Input id="shares" name="shares" type="number" min={0} />
                        </Field>
                        <Field label="Saves" htmlFor="saves" optional>
                          <Input id="saves" name="saves" type="number" min={0} />
                        </Field>
                        <Field label="Avg view (sec)" htmlFor="avgViewSec" optional>
                          <Input id="avgViewSec" name="avgViewSec" type="number" min={0} step="0.1" />
                        </Field>
                        <Field label="Retention %" htmlFor="retentionPct" optional>
                          <Input
                            id="retentionPct"
                            name="retentionPct"
                            type="number"
                            min={0}
                            max={100}
                            step="0.1"
                          />
                        </Field>
                      </div>

                      <div className="rounded-lg border border-line bg-surface p-4">
                        <p className="text-[13px] font-medium text-ink">Commercial signal</p>
                        <p className="mt-1 text-[12px] leading-relaxed text-muted">
                          Only record what you can actually attribute to this piece. A guess here
                          corrupts every downstream conclusion.
                        </p>
                        <div className="mt-3 grid gap-4 sm:grid-cols-3">
                          <Field label="Leads" htmlFor="leads" optional>
                            <Input id="leads" name="leads" type="number" min={0} />
                          </Field>
                          <Field label="Calls booked" htmlFor="bookedCalls" optional>
                            <Input id="bookedCalls" name="bookedCalls" type="number" min={0} />
                          </Field>
                          <Field label="Revenue" htmlFor="revenue" optional>
                            <Input id="revenue" name="revenue" type="number" min={0} step="0.01" />
                          </Field>
                        </div>
                      </div>
                    </>
                  )}
                </DialogBody>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setEntryOpen(false)}>
                    Cancel
                  </Button>
                  <SubmitButton variant="primary" disabled={records.length === 0}>
                    Record
                  </SubmitButton>
                </DialogFooter>
              </>
            )}
          </ActionForm>
        </DialogContent>
      </Dialog>

      {!isLive && canDerive ? (
        <span className="hidden text-[11.5px] text-ghost xl:inline">Demo generation</span>
      ) : null}
    </div>
  );
}
