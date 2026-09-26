"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { recordQaReviewAction } from "@/lib/actions/qa-review";

type Check = { key: string; label: string };
type Latest = { result: string; versionLabel: string; current: boolean; createdAt: string } | null;

/** DEL-06: the editor QA checklist against the current cut. */
export function QaPanel({ slug, contentItemId, checks, latest }: { slug: string; contentItemId: string; checks: Check[]; latest: Latest }) {
  const router = useRouter();
  const [state, setState] = React.useState<Record<string, { pass: boolean; note: string }>>(() => Object.fromEntries(checks.map((c) => [c.key, { pass: true, note: "" }])));
  const [pending, start] = React.useTransition();
  const submit = () =>
    start(async () => {
      const r = await recordQaReviewAction(slug, contentItemId, { checks: checks.map((c) => ({ key: c.key, pass: state[c.key].pass, note: state[c.key].note || undefined })) });
      if (r.ok) {
        toast.success(r.message ?? "QA recorded.");
        router.refresh();
      } else toast.error(r.error);
    });
  return (
    <section className="space-y-3 rounded-md border border-line p-4 text-[12.5px]" aria-labelledby="qa-h">
      <h2 id="qa-h" className="text-[13px] font-medium text-ink">
        Internal QA
      </h2>
      <p className="text-muted">
        {latest ? `Last pass: ${latest.result} on ${latest.versionLabel}${latest.current ? "" : " (an earlier cut; this one is not checked yet)"}.` : "Not checked yet."}
      </p>
      <ul className="space-y-1.5">
        {checks.map((c) => (
          <li key={c.key} className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-ink">
              <input type="checkbox" checked={state[c.key].pass} onChange={(e) => setState({ ...state, [c.key]: { ...state[c.key], pass: e.target.checked } })} />
              {c.label}
            </label>
            {!state[c.key].pass ? <Input value={state[c.key].note} onChange={(e) => setState({ ...state, [c.key]: { ...state[c.key], note: e.target.value } })} placeholder="What is wrong" aria-label={`What is wrong: ${c.label}`} className="max-w-xs" /> : null}
          </li>
        ))}
      </ul>
      <Button size="sm" disabled={pending} onClick={submit}>
        Record QA on this cut
      </Button>
    </section>
  );
}
