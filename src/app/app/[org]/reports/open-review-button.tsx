"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { openPeriodReviewAction } from "@/lib/actions/period-review";

/** Staff: open (or create) the draft review for a period, then go to it. */
export function OpenReviewButton({ slug, periodNumber }: { slug: string; periodNumber: number }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  return (
    <Button
      size="xs"
      variant="secondary"
      loading={pending}
      onClick={() =>
        startTransition(async () => {
          const r = await openPeriodReviewAction(slug, periodNumber);
          if (r.ok) router.push(`/app/${slug}/reports/reviews/${r.data.id}`);
          else toast.error(r.error);
        })
      }
    >
      Write review
    </Button>
  );
}
