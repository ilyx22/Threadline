"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { setContentBlockerAction } from "@/lib/actions/ownership";

/** DEL-01: say what is stopping a piece, or clear it. The history keeps both. */
export function BlockerControl({ slug, contentItemId, blockedReason, blockedAt }: { slug: string; contentItemId: string; blockedReason: string | null; blockedAt: string | null }) {
  const router = useRouter();
  const [text, setText] = React.useState("");
  const [pending, start] = React.useTransition();
  const run = (reason: string | null) =>
    start(async () => {
      const r = await setContentBlockerAction(slug, contentItemId, reason);
      if (r.ok) {
        setText("");
        router.refresh();
      } else toast.error(r.error);
    });
  return (
    <section className="space-y-2 rounded-md border border-line p-4 text-[12.5px]" aria-labelledby="blocker-h">
      <h2 id="blocker-h" className="text-[13px] font-medium text-ink">
        Blocker
      </h2>
      {blockedReason ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-negative">
            Blocked{blockedAt ? ` since ${new Date(blockedAt).toLocaleDateString("en-GB")}` : ""}: {blockedReason}
          </span>
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(null)}>
            Clear
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="What is stopping this piece?" aria-label="Blocker" className="max-w-md" />
          <Button size="sm" disabled={pending || !text.trim()} onClick={() => run(text)}>
            Mark blocked
          </Button>
        </div>
      )}
    </section>
  );
}
