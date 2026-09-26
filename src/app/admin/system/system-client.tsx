"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { requeueJobAction, retryCrmAction } from "@/lib/actions/system";

export function SystemButton({ kind, id }: { kind: "job" | "crm"; id: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  return (
    <Button
      size="xs"
      variant="secondary"
      loading={pending}
      onClick={() =>
        startTransition(async () => {
          const r = kind === "job" ? await requeueJobAction(id) : await retryCrmAction(id);
          if (r.ok) toast.success(r.message ?? "Done.");
          else toast.error(r.error);
          router.refresh();
        })
      }
    >
      {kind === "job" ? "Requeue" : "Retry"}
    </Button>
  );
}
