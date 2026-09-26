"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { setScriptOwnershipAction } from "@/lib/actions/ownership";

type Props = { slug: string; scriptId: string; ownerId: string | null; dueDate: string | null; blockedReason: string | null; people: { id: string; name: string }[] };

/** DEL-01: who moves this script on, by when, and what is stopping it. */
export function OwnershipControl({ slug, scriptId, ownerId, dueDate, blockedReason, people }: Props) {
  const router = useRouter();
  const [owner, setOwner] = React.useState(ownerId ?? "");
  const [due, setDue] = React.useState(dueDate ?? "");
  const [blocker, setBlocker] = React.useState(blockedReason ?? "");
  const [pending, start] = React.useTransition();
  return (
    <div className="flex flex-wrap items-end gap-2 text-[12.5px]">
      <label className="space-y-1">
        <span className="block text-faint">Owner</span>
        <NativeSelect value={owner} onChange={(e) => setOwner(e.target.value)} aria-label="Owner">
          <option value="">Nobody yet</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </NativeSelect>
      </label>
      <label className="space-y-1">
        <span className="block text-faint">Due</span>
        <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due date" />
      </label>
      <label className="min-w-[14rem] flex-1 space-y-1">
        <span className="block text-faint">Blocked by</span>
        <Input value={blocker} onChange={(e) => setBlocker(e.target.value)} placeholder="Nothing" aria-label="Blocker" />
      </label>
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await setScriptOwnershipAction(slug, scriptId, { ownerId: owner || null, dueDate: due || null, blockedReason: blocker || null });
            if (r.ok) router.refresh();
            else toast.error(r.error);
          })
        }
      >
        Save
      </Button>
    </div>
  );
}
