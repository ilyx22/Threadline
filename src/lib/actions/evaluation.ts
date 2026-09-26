"use server";

import { revalidatePath } from "next/cache";
import { auditInternal } from "@/lib/auth/audit";
import { requireInternalStrict } from "@/lib/auth/guard";
import { WorkflowError } from "@/lib/domain/workflow";
import { promoteVariant, rollbackPromotion, runEvaluation } from "@/lib/learning/evaluation";
import { err, guarded, okVoid, type ActionResult } from "./shared";

/** LRN-03: evaluate Judge variants on the held-out share; promote or roll back by hand. */
export async function runEvaluationAction(): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("corpus.manage");
    const ev = await runEvaluation(admin.user.id);
    await auditInternal(admin.user.id, { action: "judge.evaluate", entityType: "JudgeEvaluation", entityId: ev.id, summary: "Held-out evaluation run" });
    revalidatePath("/admin/research/calibration");
    return okVoid("Evaluated on the held-out examples.");
  });
}

export async function promoteVariantAction(evaluationId: string, variant: string): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("corpus.manage");
    try {
      await promoteVariant(admin.user.id, evaluationId, variant);
    } catch (e) {
      if (e instanceof WorkflowError) return err(e.message, "workflow");
      throw e;
    }
    await auditInternal(admin.user.id, { action: "judge.promote", entityType: "JudgePromotion", entityId: evaluationId, summary: `Promoted Judge variant ${variant}` });
    revalidatePath("/admin/research/calibration");
    return okVoid(`${variant} promoted.`);
  });
}

export async function rollbackPromotionAction(): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("corpus.manage");
    try {
      const now = await rollbackPromotion(admin.user.id);
      await auditInternal(admin.user.id, { action: "judge.rollback", entityType: "JudgePromotion", entityId: now?.id ?? "none", summary: `Rolled back the Judge promotion${now ? `; ${now.variant} is in force again` : ""}` });
    } catch (e) {
      if (e instanceof WorkflowError) return err(e.message, "workflow");
      throw e;
    }
    revalidatePath("/admin/research/calibration");
    return okVoid("Rolled back.");
  });
}
