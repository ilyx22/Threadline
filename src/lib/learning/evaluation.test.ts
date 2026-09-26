import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { prisma } from "@/lib/db/client";
import { currentPromotion, promoteVariant, rollbackPromotion } from "./evaluation";

const created: string[] = [];
const promos: string[] = [];
after(async () => {
  await prisma.judgePromotion.deleteMany({ where: { OR: [{ id: { in: promos } }, { evaluationId: { in: created } }] } });
  await prisma.judgeEvaluation.deleteMany({ where: { id: { in: created } } });
});

describe("promotion and rollback of Judge variants (LRN-03)", () => {
  it("promotes only a sufficient, better-than-chance variant, and rolls back to the previous one", async () => {
    const ev = await prisma.judgeEvaluation.create({
      data: {
        fraction: 0.3,
        results: JSON.stringify([
          { variant: "v0.2/qa-good", heldOut: 20, leaked: 1, outperformers: 5, auc: 0.74, sufficient: true },
          { variant: "v0.2/qa-coin", heldOut: 20, leaked: 0, outperformers: 5, auc: 0.5, sufficient: true },
          { variant: "v0.2/qa-few", heldOut: 4, leaked: 0, outperformers: 1, auc: 1, sufficient: false },
        ]),
      },
    });
    created.push(ev.id);
    await assert.rejects(promoteVariant("u", ev.id, "v0.2/qa-coin"), /no better than chance/);
    await assert.rejects(promoteVariant("u", ev.id, "v0.2/qa-few"), /Too few/);
    const before = await currentPromotion();
    const p = await promoteVariant("u", ev.id, "v0.2/qa-good");
    promos.push(p.id);
    assert.equal((await currentPromotion())?.variant, "v0.2/qa-good");
    const back = await rollbackPromotion("u");
    assert.equal(back?.id ?? null, before?.id ?? null, "the previous promotion is in force again");
  });
});
