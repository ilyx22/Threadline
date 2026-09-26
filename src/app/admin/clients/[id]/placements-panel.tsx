"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import { markPlacementRemovedAction, recordPlacementAction } from "@/lib/actions/proof-permission";

type Placement = { id: string; permission: string; content: string; location: string; flagReason: string | null; removed: boolean };

/** PRF-01: where this client's proof is used, and what must come down. */
export function PlacementsPanel({ slug, placements, permissions }: { slug: string; placements: Placement[]; permissions: string[] }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  return (
    <Card>
      <CardHeader title="Where their proof is used" description="Each use rests on a permission the client granted. Withdrawn or expired permissions flag the uses below for removal." />
      <CardBody className="space-y-3 pt-0">
        {placements.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-2 text-[12.5px]">
            {p.removed ? <Badge tone="outline">removed</Badge> : p.flagReason ? <Badge tone="negative">take down</Badge> : <Badge tone="positive">live</Badge>}
            <span className="text-ink">{p.location}</span>
            <span className="text-muted">{p.content.slice(0, 80)}</span>
            {p.flagReason && !p.removed ? (
              <Button
                size="xs"
                variant="secondary"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const r = await markPlacementRemovedAction(slug, p.id);
                    if (r.ok) toast.success(r.message ?? "Done.");
                    else toast.error(r.error);
                    router.refresh();
                  })
                }
              >
                Taken down
              </Button>
            ) : null}
          </div>
        ))}
        {permissions.length ? (
          <ActionForm action={recordPlacementAction.bind(null, slug)} onSuccess={() => router.refresh()} className="grid gap-2 sm:grid-cols-3 sm:items-end">
            {({ error }) => (
              <>
                <div className="sm:col-span-3">
                  <FormError error={error} />
                </div>
                <Field label="Permitted use" htmlFor="pl-perm">
                  <NativeSelect id="pl-perm" name="permission">
                    {permissions.map((k) => (
                      <option key={k} value={k}>
                        {k.replace("allow", "").replace(/([A-Z])/g, " $1").trim()}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <Field label="What is used" htmlFor="pl-content">
                  <Input id="pl-content" name="content" />
                </Field>
                <Field label="Where" htmlFor="pl-where">
                  <Input id="pl-where" name="location" placeholder="Page URL, deck or proposal" />
                </Field>
                <SubmitButton size="sm" variant="secondary">
                  Record use
                </SubmitButton>
              </>
            )}
          </ActionForm>
        ) : (
          <p className="text-[13px] text-muted">No uses are permitted yet.</p>
        )}
      </CardBody>
    </Card>
  );
}
