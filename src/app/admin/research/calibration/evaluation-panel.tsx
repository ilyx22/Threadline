"use client";

import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/forms/action-form";
import { promoteVariantAction, rollbackPromotionAction, runEvaluationAction } from "@/lib/actions/evaluation";

type Result = { variant: string; heldOut: number; leaked: number; outperformers: number; auc: number | null; sufficient: boolean };

/** LRN-03: held-out evaluation, variant comparison, and human promotion or rollback. */
export function EvaluationPanel({ latest, promoted }: { latest: { id: string; createdAt: string; results: Result[] } | null; promoted: string | null }) {
  const router = useRouter();
  const refresh = () => router.refresh();
  return (
    <section className="space-y-3 rounded-md border border-line p-4 text-[12.5px]" aria-labelledby="eval-h">
      <h2 id="eval-h" className="text-[13px] font-medium text-ink">
        Held-out evaluation
      </h2>
      <p className="text-muted">
        A fixed 30% of scored examples is held back. Each variant (rubric version and model) is scored only on those, with examples whose text contains their own outcome excluded. The measure is AUC: 0.5 is chance. In force: <span className="text-ink">{promoted ?? "nothing promoted"}</span>.
      </p>
      <div className="flex gap-2">
        <ActionButton size="sm" action={() => runEvaluationAction()} onDone={refresh}>
          Run evaluation
        </ActionButton>
        {promoted ? (
          <ActionButton size="sm" variant="ghost" action={() => rollbackPromotionAction()} onDone={refresh} confirm="Retire the current promotion and put the previous one back?">
            Roll back
          </ActionButton>
        ) : null}
      </div>
      {latest ? (
        <table className="w-full text-left">
          <thead className="text-faint">
            <tr>
              <th className="py-1 font-normal">Variant</th>
              <th className="py-1 font-normal">Held out</th>
              <th className="py-1 font-normal">Leaked, excluded</th>
              <th className="py-1 font-normal">AUC</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {latest.results.map((r) => (
              <tr key={r.variant} className="border-t border-line">
                <td className="py-1 text-ink">{r.variant}</td>
                <td className="py-1 tabular">{r.heldOut}</td>
                <td className="py-1 tabular">{r.leaked}</td>
                <td className="py-1 tabular">{r.auc ?? "n/a"}{r.sufficient ? "" : " (too few)"}</td>
                <td className="py-1 text-right">
                  {r.sufficient && r.auc !== null && r.auc > 0.5 && r.variant !== promoted ? (
                    <ActionButton size="xs" variant="ghost" action={() => promoteVariantAction(latest.id, r.variant)} onDone={refresh}>
                      Promote
                    </ActionButton>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-muted">Not run yet.</p>
      )}
    </section>
  );
}
