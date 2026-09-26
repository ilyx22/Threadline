"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, FileText, Printer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Notice } from "@/components/ui/feedback";
import { toast } from "@/components/ui/toast";
import {
  deleteReportAction,
  finaliseReportAction,
  generateWeeklyReportAction,
  reviseReportAction,
} from "@/lib/actions/reports";
import { ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function GenerateReportButton({ slug }: { slug: string }) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const router = useRouter();

  const generate = (weekOffset: number) => {
    startTransition(async () => {
      const result = await generateWeeklyReportAction(slug, weekOffset, true);
      if (result.ok) {
        toast.success(result.message ?? "Report generated.");
        setOpen(false);
        router.push(`/app/${slug}/reports/${result.data.id}`);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <>
      <Button variant="accent" icon={FileText} onClick={() => setOpen(true)}>
        Generate report
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader
            title="Generate a weekly report"
            description="Every number is computed from stored records. Regenerating the same week updates it rather than creating a duplicate."
          />
          <DialogBody className="space-y-4">
            <Notice tone="neutral">
              The executive summary is written from those numbers. If it cannot be produced, the
              report is still saved with its figures intact.
            </Notice>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" loading={pending} onClick={() => generate(1)}>
                Last week
              </Button>
              <Button variant="secondary" loading={pending} onClick={() => generate(0)}>
                This week so far
              </Button>
              <Button variant="ghost" loading={pending} onClick={() => generate(2)}>
                Two weeks ago
              </Button>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ReportDetailActions({
  slug,
  reportId,
  status,
  canManage,
  canFinalise = false,
  isLatest = true,
}: {
  slug: string;
  reportId: string;
  status: string;
  canManage: boolean;
  canFinalise?: boolean;
  isLatest?: boolean;
}) {
  const [pending, startTransition] = React.useTransition();
  const [revising, setRevising] = React.useState(false);
  const router = useRouter();

  return (
    <div className="no-print flex shrink-0 flex-wrap items-center gap-2">
      <Button variant="ghost" icon={Printer} onClick={() => window.print()}>
        Print
      </Button>

      {canFinalise && status === "final" && isLatest ? (
        <Button variant="ghost" onClick={() => setRevising(true)}>
          Start a correction
        </Button>
      ) : null}
      <Dialog open={revising} onOpenChange={setRevising}>
        <DialogContent>
          <DialogHeader title="Correct a final report" description="Creates a new draft version. The client keeps seeing the current version until the correction is finalised, and both versions stay on record." />
          <ActionForm
            action={reviseReportAction.bind(null, slug, reportId)}
            onSuccess={(d: unknown) => {
              setRevising(false);
              router.push(`/app/${slug}/reports/${(d as { id: string }).id}`);
            }}
            className="contents"
          >
            {({ error, fieldErrors }) => (
              <>
                <DialogBody className="space-y-3">
                  <FormError error={error} />
                  <Field label="What is being corrected, and why" htmlFor="revise-reason" error={fieldErrors.reason}>
                    <Input id="revise-reason" name="reason" required />
                  </Field>
                </DialogBody>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setRevising(false)}>
                    Cancel
                  </Button>
                  <SubmitButton variant="primary">Start correction</SubmitButton>
                </DialogFooter>
              </>
            )}
          </ActionForm>
        </DialogContent>
      </Dialog>

      {canFinalise && status !== "final" ? (
        <Button
          variant="accent"
          icon={BadgeCheck}
          loading={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await finaliseReportAction(slug, reportId);
              if (result.ok) {
                toast.success(result.message ?? "Report marked final.");
                router.refresh();
              } else {
                toast.error(result.error);
              }
            })
          }
        >
          Mark final
        </Button>
      ) : null}

      {canManage && status !== "final" ? (
        <Button
          variant="ghost"
          icon={Trash2}
          loading={pending}
          onClick={() => {
            if (!window.confirm("Delete this draft report?")) return;
            startTransition(async () => {
              const result = await deleteReportAction(slug, reportId);
              if (result.ok) {
                toast.success("Draft deleted.");
                router.push(`/app/${slug}/reports`);
              } else {
                toast.error(result.error);
              }
            });
          }}
        >
          <span className="sr-only">Delete draft</span>
        </Button>
      ) : null}
    </div>
  );
}
