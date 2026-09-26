"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ActionButton } from "@/components/forms/action-form";
import { createInboundSourceAction, revokeInboundSourceAction } from "@/lib/actions/leads";

type Source = { id: string; label: string; channel: string; createdAt: string; lastUsedAt: string | null; revoked: boolean };

export function InboundSources({ slug, sources }: { slug: string; sources: Source[] }) {
  const router = useRouter();
  const [label, setLabel] = React.useState("Website form");
  const [token, setToken] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <Input value={label} onChange={(e) => setLabel(e.target.value)} aria-label="Source name" className="max-w-xs" />
        <Button
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await createInboundSourceAction(slug, label);
              if (r.ok) {
                setToken(r.data.token);
                setError(null);
                router.refresh();
              } else setError(r.error);
            })
          }
        >
          Create source
        </Button>
      </div>
      {error ? <p className="text-[12.5px] text-negative">{error}</p> : null}
      {token ? (
        <div className="rounded-md border border-line bg-surface p-3 text-[12.5px]">
          <p className="text-ink">Copy this token now. It is not shown again.</p>
          <code className="mt-1 block break-all text-[12px]">{token}</code>
        </div>
      ) : null}
      <ul className="divide-y divide-line rounded-md border border-line">
        {sources.length === 0 ? <li className="px-3 py-2 text-[12.5px] text-muted">No sources yet.</li> : null}
        {sources.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 px-3 py-2 text-[12.5px]">
            <span className="text-muted">
              <span className="text-ink">{s.label}</span> · created {new Date(s.createdAt).toLocaleDateString("en-GB")} · {s.lastUsedAt ? `last used ${new Date(s.lastUsedAt).toLocaleString("en-GB")}` : "never used"}
              {s.revoked ? " · revoked" : ""}
            </span>
            {!s.revoked ? (
              <ActionButton size="xs" variant="ghost" action={() => revokeInboundSourceAction(slug, s.id)} confirm={`Revoke "${s.label}"? Anything using its token stops working.`} onDone={() => router.refresh()}>
                Revoke
              </ActionButton>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
