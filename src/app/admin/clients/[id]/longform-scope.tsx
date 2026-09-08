"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ActionButton } from "@/components/forms/action-form";
import { setLongFormScopeAction } from "@/lib/actions/admin";

/**
 * Long-form scope control.
 *
 * Shown on every client so an operator can tell at a glance whether long-form
 * is in scope. Enabling is a deliberate act with an audit line behind it,
 * because long-form has its own capacity cost and should never arrive as a
 * side effect of somebody editing a settings form.
 */
export function LongFormScope({
  orgId,
  enabled,
  label,
  note,
  tone,
  canManage,
}: {
  orgId: string;
  enabled: boolean;
  label: string;
  note: string;
  tone: "accent" | "outline";
  canManage: boolean;
}) {
  const router = useRouter();

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={tone}>{label}</Badge>
        {!enabled ? (
          <span className="text-[11.5px] text-ghost">Not included in the base retainer</span>
        ) : null}
      </div>

      <p className="text-[12.5px] leading-relaxed text-muted">{note}</p>

      {canManage ? (
        <ActionButton
          size="sm"
          variant={enabled ? "ghost" : "secondary"}
          action={() => setLongFormScopeAction(orgId, !enabled)}
          confirm={
            enabled
              ? "Disable long-form for this client? Existing long-form work stays; no new long-form can be created."
              : "Enable long-form? This is a pilot with its own capacity and pricing — only do this against an agreed scope."
          }
          onDone={() => router.refresh()}
        >
          {enabled ? "Disable long-form" : "Enable the long-form pilot"}
        </ActionButton>
      ) : null}
    </div>
  );
}
