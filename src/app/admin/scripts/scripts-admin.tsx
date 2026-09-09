"use client";

import * as React from "react";
import { useTransition } from "react";
import { Check, Download, Plus, XCircle } from "lucide-react";
import { ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { approveScriptAction, createScriptVersionAction, importCanonicalDraftsAction, retireScriptAction } from "@/lib/actions/sales-scripts";

type Script = { id: string; key: string; version: number; stage: string; context: string; exactText: string; checksum: string; status: string; provenance: string; approvedAt: string | null; retiredAt: string | null };

export function ScriptsAdmin({ scripts, stages }: { scripts: Script[]; stages: string[] }) {
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) =>
    start(async () => {
      const r = await fn();
      if (r.ok) toast.success(r.message ?? "Done.");
      else toast.error(r.error ?? "Something went wrong.");
    });

  const grouped = new Map<string, Script[]>();
  for (const s of scripts) grouped.set(s.stage, [...(grouped.get(s.stage) ?? []), s]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" icon={Download} loading={pending} onClick={() => run(() => importCanonicalDraftsAction())}>
          Import draft documents verbatim
        </Button>
      </div>

      {stages.filter((st) => grouped.has(st)).map((stage) => (
        <Card key={stage}>
          <CardHeader title={stage.replace(/_/g, " ")} eyebrow={`${grouped.get(stage)!.length} block${grouped.get(stage)!.length === 1 ? "" : "s"}`} />
          <CardBody className="pt-0 space-y-3">
            {grouped.get(stage)!.map((s) => (
              <div key={s.id} className={`rounded-lg border p-4 ${s.status === "approved" ? "border-positive/30" : s.status === "retired" ? "border-line opacity-70" : "border-warning/30"}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono text-[12px] text-ink">{s.key}</p>
                  <Badge tone="outline">v{s.version}</Badge>
                  <Badge tone={s.status === "approved" ? "positive" : s.status === "retired" ? "neutral" : "warning"}>{s.status}</Badge>
                  <span className="ml-auto font-mono text-[10.5px] text-ghost">{s.checksum.slice(0, 12)}</span>
                </div>
                <p className="mt-1 text-[12px] text-faint">{s.context} · {s.provenance}</p>
                <pre className="mt-3 whitespace-pre-wrap rounded-md bg-surface p-3 text-[13px] leading-relaxed text-ink">{s.exactText}</pre>
                <div className="mt-3 flex gap-2">
                  {s.status === "draft" ? (
                    <Button size="sm" variant="primary" icon={Check} loading={pending} onClick={() => run(() => approveScriptAction(s.id))}>
                      Approve as canonical
                    </Button>
                  ) : null}
                  {s.status !== "retired" ? (
                    <Button size="sm" variant="ghost" icon={XCircle} loading={pending} onClick={() => run(() => retireScriptAction(s.id))}>
                      Retire
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      ))}

      <Card>
        <CardHeader title="New draft version" eyebrow="Exact wording" description="Paste the text exactly as it should be said. It becomes usable only after approval." />
        <CardBody className="pt-0">
          <ActionForm action={createScriptVersionAction} className="space-y-4">
            {({ error }) => (
              <>
                <FormError error={error} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Key" htmlFor="key" hint="e.g. discovery.open — reusing a key creates the next version">
                    <Input id="key" name="key" required placeholder="discovery.open" />
                  </Field>
                  <Field label="Stage" htmlFor="stage">
                    <NativeSelect id="stage" name="stage">
                      {stages.map((st) => (
                        <option key={st} value={st}>{st.replace(/_/g, " ")}</option>
                      ))}
                    </NativeSelect>
                  </Field>
                </div>
                <Field label="When it is used" htmlFor="context">
                  <Input id="context" name="context" required placeholder="Opening the discovery call after small talk" />
                </Field>
                <Field label="Exact text" htmlFor="exactText">
                  <Textarea id="exactText" name="exactText" rows={6} required />
                </Field>
                <Field label="Provenance" htmlFor="provenance" hint="Document, author, date">
                  <Input id="provenance" name="provenance" required placeholder="Founder, approved 9 Sep 2026" />
                </Field>
                <SubmitButton icon={Plus}>Save draft</SubmitButton>
              </>
            )}
          </ActionForm>
        </CardBody>
      </Card>
    </div>
  );
}
