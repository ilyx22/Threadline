import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { auc, evaluateVariants, isHeldOut, leakage, type EvalPair } from "./evaluation";

describe("held-out evaluation (LRN-03)", () => {
  it("splits deterministically, holding back about the stated share", () => {
    const ids = Array.from({ length: 2000 }, (_, i) => `ex-${i}`);
    const held = ids.filter((id) => isHeldOut(id));
    assert.ok(held.length > 500 && held.length < 700, `${held.length}`);
    assert.deepEqual(ids.filter((id) => isHeldOut(id)), held, "same split every time");
  });

  it("detects outcome leakage in what the Judge saw, but not ordinary text", () => {
    assert.deepEqual(leakage("Hook: why partners leave. Notes: this got 48,200 views", { views: 48200, likes: 900, comments: 40 }), ["views 48,200"]);
    assert.deepEqual(leakage("Transcript mentions 48.2k people", { views: 48200, likes: 10, comments: 1 }), ["views 48.2k"]);
    assert.deepEqual(leakage("This went viral last spring", { views: 10, likes: 1, comments: 1 }), ["outcome wording"]);
    assert.deepEqual(leakage("We have 3 partners and 12 staff", { views: 3, likes: 12, comments: 0 }), [], "small numbers are ignored");
    assert.deepEqual(leakage("Title about pricing", { views: 5000, likes: 200, comments: 60 }), []);
  });

  it("measures ranking with AUC: perfect, coin and inverted", () => {
    assert.equal(auc([{ outperformed: true, overall: 80 }, { outperformed: false, overall: 40 }]), 1);
    assert.equal(auc([{ outperformed: true, overall: 50 }, { outperformed: false, overall: 50 }]), 0.5);
    assert.equal(auc([{ outperformed: true, overall: 30 }, { outperformed: false, overall: 70 }]), 0);
    assert.equal(auc([{ outperformed: true, overall: 30 }]), null);
  });

  it("compares variants on the held-out share only and excludes leaked examples", () => {
    const pairs: EvalPair[] = [];
    for (let i = 0; i < 400; i++) {
      const outperformed = i % 4 === 0;
      const subject = i % 10 === 0 ? `Notes: ${1000 + i} views` : "Title only";
      const outcome = { views: 1000 + i, likes: 0, comments: 0 };
      pairs.push({ exampleId: `e${i}`, outperformed, overall: outperformed ? 70 : 40, variant: "v0.2/good", subject, outcome });
      pairs.push({ exampleId: `e${i}`, outperformed, overall: outperformed ? 40 : 70, variant: "v0.2/bad", subject, outcome });
    }
    const r = evaluateVariants(pairs);
    const good = r.find((v) => v.variant === "v0.2/good")!;
    const bad = r.find((v) => v.variant === "v0.2/bad")!;
    assert.equal(good.auc, 1);
    assert.equal(bad.auc, 0);
    assert.ok(good.leaked > 0, "leaked examples are counted");
    assert.equal(good.heldOut + good.leaked < 400, true, "only the held-out share is used");
    assert.equal(good.sufficient, true);
  });
});
