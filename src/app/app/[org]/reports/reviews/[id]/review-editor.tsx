"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import { draftReviewSectionsAction, finaliseReviewAction, refreshReviewFiguresAction, reviseReviewAction, saveReviewAction } from "@/lib/actions/period-review";

type Section = { key: "action" | "results" | "problems" | "future"; title: string; ask: string; value: string };

/** Staff editor for a draft four-week review, or the correction starter for a final one. */
export function ReviewEditor({ slug, reviewId, sections, reviseOnly = false }: { slug: string; reviewId: string; sections: Section[]; reviseOnly?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) =>
    startTransition(async () => {
      const r = await fn();
      if (r.ok) {
        toast.success(r.message ?? "Done.");
        router.refresh();
      } else toast.error(r.error ?? "Something went wrong.");
    });

  if (reviseOnly) {
    return (
      <ActionForm action={reviseReviewAction.bind(null, slug, reviewId)} onSuccess={(d: unknown) => router.push(`/app/${slug}/reports/reviews/${(d as { id: string }).id}`)} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        {({ error, fieldErrors }) => (
          <>
            <div className="flex-1">
              <FormError error={error} />
              <Field label="Correct this review: what changes, and why" htmlFor="review-reason" error={fieldErrors.reason}>
                <Input id="review-reason" name="reason" />
              </Field>
            </div>
            <SubmitButton variant="secondary">Start a correction</SubmitButton>
          </>
        )}
      </ActionForm>
    );
  }

  return (
    <ActionForm action={saveReviewAction.bind(null, slug, reviewId)} onSuccess={() => router.refresh()} className="space-y-4">
      {({ error }) => (
        <>
          <FormError error={error} />
          {sections.map((s) => (
            <Card key={s.key}>
              <CardHeader title={s.title} eyebrow={s.ask} />
              <CardBody className="pt-0">
                <Textarea name={s.key} defaultValue={s.value} rows={5} aria-label={s.title} />
              </CardBody>
            </Card>
          ))}
          <div className="flex flex-wrap gap-2">
            <SubmitButton variant="secondary">Save draft</SubmitButton>
            <Button type="button" variant="ghost" icon={RefreshCw} disabled={pending} onClick={() => run(() => refreshReviewFiguresAction(slug, reviewId))}>
              Recompute figures
            </Button>
            <Button type="button" variant="ghost" disabled={pending} onClick={() => run(() => draftReviewSectionsAction(slug, reviewId))}>
              Draft empty sections from the records
            </Button>
            <Button
              type="button"
              variant="accent"
              icon={BadgeCheck}
              disabled={pending}
              onClick={() => {
                if (!window.confirm("Finalise and send this review to the client? Save your latest edits first.")) return;
                run(() => finaliseReviewAction(slug, reviewId));
              }}
            >
              Finalise and send
            </Button>
          </div>
        </>
      )}
    </ActionForm>
  );
}
