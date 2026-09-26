import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { prisma } from "@/lib/db/client";
import { createSchedule, runDueSchedules, runSchedule } from "./schedules";

const stamp = Date.now();
let orgId = "";
let userId = "";

before(async () => {
  orgId = (await prisma.organization.create({ data: { slug: `qa-sched-${stamp}`, name: "QA Schedule", kind: "client", synthetic: true } })).id;
  userId = (await prisma.user.create({ data: { email: `sched-${stamp}@example.com`, name: "Operator", passwordHash: "x" } })).id;
  const item = await prisma.contentItem.create({ data: { orgId, title: "Published piece", stage: "live", liveAt: new Date(Date.now() - 2 * 86_400_000), platform: "linkedin" } as never });
  const rec = await prisma.publishRecord.create({ data: { orgId, contentItemId: item.id, platform: "linkedin", status: "published", publishedAt: new Date(Date.now() - 2 * 86_400_000), url: "https://www.linkedin.com/feed/update/1" } });
  await prisma.performanceSnapshot.create({ data: { orgId, publishRecordId: rec.id, views: 1200 } as never });
});
after(async () => {
  await prisma.researchSchedule.deleteMany({ where: { orgId } });
  await prisma.organization.delete({ where: { id: orgId } });
  await prisma.user.delete({ where: { id: userId } });
});

describe("scheduled research (AI-02)", () => {
  it("opens a run, collects what it can, explains what it could not, and waits for a person", async () => {
    await assert.rejects(createSchedule(orgId, userId, { label: "Weekly", cadenceDays: 0, sources: [] }), /1 to 90 days/);
    const s = await createSchedule(orgId, userId, {
      label: "Weekly market read",
      cadenceDays: 7,
      sources: [
        { kind: "historic_content", label: "Our published work" },
        { kind: "competitor", label: "Rival blog", url: "https://threadline-qa.invalid/post" },
        { kind: "sales_call", label: "This week's calls" },
      ],
    });
    const out = (await runSchedule(s.id)) as { runId: string; collected: number; unavailable: { label: string; reason: string }[]; waitingForPerson: string[] };
    assert.ok(out.runId);
    const run = await prisma.intelligenceRun.findUniqueOrThrow({ where: { id: out.runId } });
    assert.equal(run.status, "collecting", "a person takes it from here");
    assert.deepEqual(out.unavailable.map((u) => u.label), ["Rival blog"]);
    assert.match(out.unavailable[0].reason, /resolve|reached/i);
    assert.deepEqual(out.waitingForPerson, ["This week's calls"]);
    const sources = await prisma.runSource.findMany({ where: { runId: out.runId }, orderBy: { createdAt: "asc" } });
    assert.deepEqual(sources.map((x) => x.status), ["collected", "unavailable", "pending"]);
    const next = await prisma.researchSchedule.findUniqueOrThrow({ where: { id: s.id } });
    assert.ok(next.nextRunAt.getTime() > Date.now() + 6 * 86_400_000);
    assert.equal(await runSchedule(s.id), null, "not due again until the cadence passes");
  });

  it("skips, with the reason, while a run is still open", async () => {
    await prisma.researchSchedule.updateMany({ where: { orgId }, data: { nextRunAt: new Date(Date.now() - 1000) } });
    assert.equal(await runDueSchedules(), 1);
    const s = await prisma.researchSchedule.findFirstOrThrow({ where: { orgId } });
    assert.match(s.lastOutcome ?? "", /still open/);
  });
});
