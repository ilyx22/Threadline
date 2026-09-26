import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { prisma } from "@/lib/db/client";
import { calendarDate, deleteEffort, founderMinutesByStep, operatorLoad, recordEffort, weeklyEffort, weekStart } from "./index";

const stamp = Date.now();
let orgId = "";
let userId = "";
const now = new Date("2026-09-24T12:00:00Z"); // a Thursday

before(async () => {
  orgId = (await prisma.organization.create({ data: { slug: `qa-effort-${stamp}`, name: "QA Effort", kind: "client", synthetic: true } })).id;
  userId = (await prisma.user.create({ data: { email: `effort-${stamp}@example.com`, name: "Founder", passwordHash: "x" } })).id;
});
after(async () => {
  await prisma.organization.delete({ where: { id: orgId } });
  await prisma.user.delete({ where: { id: userId } });
});

describe("effort records (CX-08, CAP-01)", () => {
  it("validates dates, minutes and steps", async () => {
    assert.throws(() => calendarDate("2026-02-30"), /does not exist/);
    assert.equal(weekStart(now).toISOString().slice(0, 10), "2026-09-21");
    await assert.rejects(recordEffort(orgId, userId, { actorKind: "founder", step: "recording", minutes: 0, workDate: "2026-09-24" }, now), /1 to 1,440/);
    await assert.rejects(recordEffort(orgId, userId, { actorKind: "founder", step: "recording", minutes: 30, workDate: "2026-09-30" }, now), /future/);
    await assert.rejects(recordEffort(orgId, userId, { actorKind: "founder", step: "dancing" as never, minutes: 30, workDate: "2026-09-24" }, now), /Unknown step/);
    // the database refuses an out-of-range value even if the service is bypassed
    await assert.rejects(prisma.effortEntry.create({ data: { orgId, userId, actorKind: "founder", step: "call", minutes: 2000, workDate: new Date("2026-09-24") } }));
  });

  it("sums per week by who spent the time, marks unrecorded weeks and the founder budget", async () => {
    await recordEffort(orgId, userId, { actorKind: "founder", step: "recording", minutes: 40, workDate: "2026-09-22" }, now);
    await recordEffort(orgId, userId, { actorKind: "founder", step: "approval", minutes: 35, workDate: "2026-09-24" }, now);
    await recordEffort(orgId, userId, { actorKind: "operator", step: "editing", minutes: 120, workDate: "2026-09-23" }, now);
    await recordEffort(orgId, userId, { actorKind: "founder", step: "call", minutes: 20, workDate: "2026-09-15" }, now);
    const weeks = await weeklyEffort(orgId, 3, now);
    assert.deepEqual(weeks.map((w) => w.weekStart), ["2026-09-07", "2026-09-14", "2026-09-21"]);
    assert.equal(weeks[0].founder, null, "no entries is not recorded, not zero");
    assert.equal(weeks[1].founder, 20);
    assert.equal(weeks[2].founder, 75);
    assert.equal(weeks[2].overBudget, true);
    assert.equal(weeks[2].operator, 120);
    const steps = await founderMinutesByStep(orgId, new Date("2026-09-01"));
    assert.deepEqual(steps[0], { step: "recording", minutes: 40 });
    const load = (await operatorLoad(now)).find((l) => l.orgId === orgId);
    assert.deepEqual(load && { m: load.minutes4w, w: load.perWeek }, { m: 120, w: 30 });
  });

  it("lets a person remove only their own recent entries", async () => {
    const e = await recordEffort(orgId, userId, { actorKind: "founder", step: "other", minutes: 5, workDate: "2026-09-24" }, now);
    await assert.rejects(deleteEffort(orgId, e.id, { userId: "someone-else", isStaff: false }), /own entries/);
    await deleteEffort(orgId, e.id, { userId, isStaff: false });
    assert.equal(await prisma.effortEntry.count({ where: { id: e.id } }), 0);
  });
});
