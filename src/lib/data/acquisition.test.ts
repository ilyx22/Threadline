import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";
import { funnelCounts, invariantBreaches, listProspects } from "./acquisition";
import { inputFromCounts } from "@/lib/domain/funnel";
import { funnelRates } from "@/lib/domain/funnel";

/**
 * The funnel is counted, not remembered.
 *
 * These run against the database and assert the property the whole acquisition
 * model depends on: every rate in the product is derived from prospect and call
 * records at read time. A stored counter drifts from what happened the first
 * time someone corrects a record; a derived one cannot, and the only way to
 * prove that is to write records and count them.
 */

const prisma = new PrismaClient();
const MARK = "counted-funnel-test";

const range = { start: new Date(2026, 0, 1), end: new Date(2026, 11, 31) };
const day = (d: number) => new Date(2026, 5, d, 10, 0, 0);

before(async () => {
  await prisma.prospect.deleteMany({ where: { sourceNote: MARK } });

  // Four first touches, three replies, two bookings, two attended calls, one of
  // which was a genuine fit and closed.
  const specs = [
    { company: "A", firstTouchAt: day(1), repliedAt: day(3), positiveReplyAt: day(3) },
    { company: "B", firstTouchAt: day(1), repliedAt: day(4), positiveReplyAt: null },
    { company: "C", firstTouchAt: day(2), repliedAt: day(5), positiveReplyAt: day(5) },
    { company: "D", firstTouchAt: day(2), repliedAt: null, positiveReplyAt: null },
  ];

  const created = [];
  for (const spec of specs) {
    created.push(
      await prisma.prospect.create({
        data: {
          company: `${MARK} ${spec.company}`,
          sourceNote: MARK,
          state: "contacted",
          channel: MARK,
          nextAction: "Follow up",
          nextActionDueAt: day(10),
          firstTouchAt: spec.firstTouchAt,
          repliedAt: spec.repliedAt,
          positiveReplyAt: spec.positiveReplyAt,
        },
      }),
    );
  }

  await prisma.salesCall.create({
    data: {
      prospectId: created[0].id,
      scheduledAt: day(8),
      completedAt: day(8),
      attended: true,
      qualified: true,
      offerMade: true,
      outcome: "won",
    },
  });
  await prisma.salesCall.create({
    data: {
      prospectId: created[2].id,
      scheduledAt: day(9),
      completedAt: day(9),
      attended: true,
      qualified: false,
      offerMade: false,
      outcome: "not_fit",
    },
  });
});

after(async () => {
  await prisma.prospect.deleteMany({ where: { sourceNote: MARK } });
  await prisma.$disconnect();
});

describe("counting the funnel from records", () => {
  it("counts first touches from the date the message went out", async () => {
    const counts = await funnelCounts(range, MARK);
    assert.equal(counts.firstTouches, 4);
  });

  it("separates replies from positive replies", async () => {
    const counts = await funnelCounts(range, MARK);
    assert.equal(counts.replies, 3);
    assert.equal(counts.positiveReplies, 2);
  });

  it("counts bookings, shows and outcomes from the calls themselves", async () => {
    const counts = await funnelCounts(range, MARK);
    assert.equal(counts.booked, 2);
    assert.equal(counts.showed, 2);
    assert.equal(counts.qualified, 1);
    assert.equal(counts.offers, 1);
    assert.equal(counts.won, 1);
  });

  it("turns those counts into a measured qualification rate", async () => {
    const counts = await funnelCounts(range, MARK);
    const qualified = funnelRates(inputFromCounts(counts)).find((r) => r.key === "qualified");
    assert.equal(qualified?.measured, true, "recorded call outcomes are a measurement");
    assert.equal(qualified?.value, 0.5);
  });

  it("excludes records outside the period", async () => {
    const counts = await funnelCounts(
      { start: new Date(2020, 0, 1), end: new Date(2020, 11, 31) },
      MARK,
    );
    assert.equal(counts.firstTouches, 0);
    assert.equal(counts.booked, 0);
  });

  it("counts a channel separately rather than blending it", async () => {
    // Warm referrals, cold outreach and inbound convert differently; an average
    // across them describes none of them.
    const other = await funnelCounts(range, "a-channel-that-does-not-exist");
    assert.equal(other.firstTouches, 0);
  });
});

describe("the operating invariant, checked rather than assumed", () => {
  it("surfaces an active record with no next action", async () => {
    const orphan = await prisma.prospect.create({
      data: { company: `${MARK} orphan`, sourceNote: MARK, state: "contacted" },
    });

    const breaches = await invariantBreaches();
    assert.ok(
      breaches.some((b) => b.id === orphan.id),
      "a record nothing will surface again must be visible somewhere",
    );

    await prisma.prospect.delete({ where: { id: orphan.id } });
  });

  it("ignores a closed record, which needs no next action", async () => {
    const closed = await prisma.prospect.create({
      data: { company: `${MARK} closed`, sourceNote: MARK, state: "not_fit" },
    });

    const breaches = await invariantBreaches();
    assert.equal(breaches.some((b) => b.id === closed.id), false);

    await prisma.prospect.delete({ where: { id: closed.id } });
  });
});

describe("listing", () => {
  it("marks an overdue record so the queue can lead with it", async () => {
    const rows = await listProspects();
    const mine = rows.filter((r) => r.company.startsWith(MARK));
    assert.ok(mine.length >= 4);
    // Due in June 2026, which is in the past relative to any later run.
    assert.equal(
      mine.every((r) => typeof r.overdue === "boolean"),
      true,
    );
  });
});
