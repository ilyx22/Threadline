"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ActionButton } from "@/components/forms/action-form";
import { setSyntheticAction } from "@/lib/actions/admin";
import { SYNTHETIC_EXPLANATION } from "@/lib/domain/synthetic";

/**
 * The synthetic marker.
 *
 * A dry run runs through the real fulfilment path on purpose, which is exactly
 * why it needs a marker that is structural rather than a naming convention.
 * Clearing it is the dangerous direction — it makes every figure in the
 * workspace eligible for portfolio revenue and for proof — so that direction
 * carries the heavier warning.
 */
export function SyntheticScope({
  orgId,
  synthetic,
  canManage,
}: {
  orgId: string;
  synthetic: boolean;
  canManage: boolean;
}) {
  const router = useRouter();

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={synthetic ? "warning" : "outline"}>
          {synthetic ? "Synthetic dry run" : "Real client"}
        </Badge>
        {synthetic ? (
          <span className="text-[11.5px] text-ghost">
            Excluded from portfolio totals and refused as proof
          </span>
        ) : null}
      </div>

      <p className="text-[12.5px] leading-relaxed text-muted">
        {synthetic
          ? SYNTHETIC_EXPLANATION
          : "Everything in this workspace counts as a real client result: it appears in portfolio revenue, and it may be used as proof."}
      </p>

      {canManage ? (
        <ActionButton
          size="sm"
          variant={synthetic ? "secondary" : "ghost"}
          action={() => setSyntheticAction(orgId, !synthetic)}
          confirm={
            synthetic
              ? "Clear the synthetic marker? Every figure in this workspace will then count as a real client result — it will enter portfolio revenue and become usable as proof. Only do this if it is genuinely a paying client."
              : "Mark this workspace as a synthetic dry run? It will be excluded from portfolio totals and refused wherever proof is used."
          }
          onDone={() => router.refresh()}
        >
          {synthetic ? "This is a real client" : "Mark as a synthetic dry run"}
        </ActionButton>
      ) : null}
    </div>
  );
}
