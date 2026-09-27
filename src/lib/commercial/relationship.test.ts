import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { prisma } from "@/lib/db/client";
import { AttioClient } from "@/lib/crm/attio";
import { markerFor, pushCadence } from "@/lib/crm/cadence-sync";
import { TOUCH_KEYS } from "./cadence";
import { activateEngagement, endEngagement, pauseEngagement, rescheduleStart, resumeEngagement, setRelationshipPlan } from "./engagements";
import { markTouchDone, syncCadence } from "./relationship";

/**
 * A disposable client through the whole 12-week relationship sequence, against
 * a fake Attio that implements the documented Tasks contract (create, list by
 * company, update deadline/completion, delete, 404 for a missing task).
 */
type FakeTask = { content: string; deadline_at: string | null; is_completed: boolean; company: string; assignee: string | null };
function fakeAttio() {
  const tasks = new Map<string, FakeTask>();
  let seq = 0;
  let dropNextCreateReply = false;
  const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  const view = (id: string, t: FakeTask) => ({ id: { workspace_id: "w", task_id: id }, content_plaintext: t.content, deadline_at: t.deadline_at, is_completed: t.is_completed });
  const fetchImpl = (async (url: string | URL, init?: RequestInit) => {
    const u = new URL(String(url));
    const method = init?.method ?? "GET";
    const body = init?.body ? (JSON.parse(String(init.body)) as { data: Record<string, unknown> }).data : {};
    const id = u.pathname.split("/")[3];
    if (method === "POST" && u.pathname === "/v2/tasks") {
      const link = (body.linked_records as { target_record_id: string }[])[0];
      const assignee = (body.assignees as { workspace_member_email_address?: string }[])[0]?.workspace_member_email_address ?? null;
      const t: FakeTask = { content: String(body.content), deadline_at: String(body.deadline_at), is_completed: false, company: link.target_record_id, assignee };
      const tid = `task_${++seq}`;
      tasks.set(tid, t);
      if (dropNextCreateReply) {
        dropNextCreateReply = false;
        throw new TypeError("socket hang up"); // created in Attio, reply lost
      }
      return json(200, { data: view(tid, t) });
    }
    if (method === "GET" && u.pathname === "/v2/tasks") {
      const rec = u.searchParams.get("linked_record_id");
      return json(200, { data: [...tasks].filter(([, t]) => t.company === rec).map(([k, t]) => view(k, t)) });
    }
    const t = tasks.get(id);
    if (!t) return json(404, { message: "Task not found" });
    if (method === "PATCH") {
      if ("deadline_at" in body) t.deadline_at = String(body.deadline_at);
      if ("is_completed" in body) t.is_completed = Boolean(body.is_completed);
      return json(200, { data: view(id, t) });
    }
    if (method === "DELETE") {
      tasks.delete(id);
      return json(200, {});
    }
    return json(400, { message: "unsupported" });
  }) as typeof fetch;
  return { tasks, client: new AttioClient("test-token", fetchImpl), dropReply: () => (dropNextCreateReply = true) };
}

const stamp = Date.now();
let orgId = "";
let ownerId = "";
let engagementId = "";
const touch = (key: string) => prisma.relationshipTouch.findUniqueOrThrow({ where: { engagementId_key: { engagementId, key } } });

before(async () => {
  ownerId = (await prisma.user.create({ data: { email: `ilyas-${stamp}@threadline.example`, name: "Relationship Owner", passwordHash: "x" } })).id;
  orgId = (await prisma.organization.create({ data: { slug: `qa-cadence-${stamp}`, name: "Disposable Client LLC", kind: "client", synthetic: false } })).id;
  engagementId = (await prisma.engagement.create({ data: { orgId, setupFeeMinor: 250000, periodFeeMinor: 250000, timezone: "America/New_York", createdById: ownerId } })).id;
  await prisma.crmLink.create({ data: { provider: "attio", entityType: "organization", entityId: orgId, remoteObject: "companies", remoteId: `rec_company_${stamp}` } });
});
after(async () => {
  await prisma.job.deleteMany({ where: { OR: [{ orgId }, { type: "crm.cadence", payload: { contains: engagementId } }] } });
  await prisma.crmLink.deleteMany({ where: { entityId: orgId } });
  await prisma.organization.delete({ where: { id: orgId } });
  await prisma.user.delete({ where: { id: ownerId } });
});

describe("relationship cadence: disposable client, 12-week sequence", () => {
  const attio = fakeAttio();
  const openTasks = () => [...attio.tasks.values()].filter((t) => !t.is_completed);

  it("activation plans the ten touches exactly once, and re-planning changes nothing", async () => {
    await activateEngagement(engagementId, "2026-11-02", new Date("2026-10-26T12:00:00Z"));
    assert.equal(await prisma.relationshipTouch.count({ where: { engagementId } }), TOUCH_KEYS.length);
    assert.deepEqual(await syncCadence(engagementId), { created: 0, moved: 0, cancelled: 0 });
    assert.ok(await prisma.job.count({ where: { type: "crm.cadence", payload: { contains: engagementId } } }) >= 1, "Attio sync queued");
  });

  it("holds without writing when Attio is not configured (not production / no key)", async () => {
    const r = await pushCadence(engagementId, { env: {} });
    assert.match(r.held ?? "", /ATTIO_API_KEY/);
    assert.equal(attio.tasks.size, 0);
    assert.match((await touch("w1")).syncError ?? "", /ATTIO_API_KEY/);
  });

  it("creates one linked, assigned, dated Attio task per touch, idempotently", async () => {
    const r = await pushCadence(engagementId, { client: attio.client, env: {} });
    assert.equal(r.created, TOUCH_KEYS.length);
    assert.equal(attio.tasks.size, TOUCH_KEYS.length);
    const w1 = await touch("w1");
    const remote = attio.tasks.get(w1.attioTaskId!)!;
    assert.equal(remote.company, `rec_company_${stamp}`, "linked to the client company");
    assert.equal(remote.assignee, `ilyas-${stamp}@threadline.example`, "assigned to the relationship owner");
    assert.equal(remote.deadline_at, w1.dueAt.toISOString());
    assert.ok(remote.content.includes(markerFor(engagementId, "w1")) && remote.content.includes("America/New_York"));
    const again = await pushCadence(engagementId, { client: attio.client, env: {} });
    assert.deepEqual([again.created, again.moved], [0, 0], "second run creates and moves nothing");
    assert.equal(attio.tasks.size, TOUCH_KEYS.length);
  });

  it("adopts a task whose create reply was lost instead of duplicating it", async () => {
    const w3 = await touch("w3");
    attio.tasks.delete(w3.attioTaskId!);
    await prisma.relationshipTouch.update({ where: { id: w3.id }, data: { attioTaskId: null, syncedDueAt: null } });
    attio.dropReply();
    await assert.rejects(pushCadence(engagementId, { client: attio.client, env: {} }), /unreachable/);
    const r = await pushCadence(engagementId, { client: attio.client, env: {} });
    assert.equal(r.created, 0, "found by its marker");
    assert.equal(attio.tasks.size, TOUCH_KEYS.length);
    assert.ok((await touch("w3")).attioTaskId);
  });

  it("the agreed slot rebases open tasks; a task ticked in Attio becomes done and never moves", async () => {
    const w1 = await touch("w1");
    attio.tasks.get(w1.attioTaskId!)!.is_completed = true; // owner ticks it in Attio
    await pushCadence(engagementId, { client: attio.client, env: {} });
    assert.equal((await touch("w1")).status, "done");

    const before = await touch("w2");
    await setRelationshipPlan(engagementId, { checkInWeekday: 3, checkInTime: "15:00", kickoffAt: new Date("2026-11-02T15:00:00Z") }, new Date("2026-10-27T12:00:00Z"));
    const w2 = await touch("w2");
    assert.notEqual(w2.dueAt.getTime(), before.dueAt.getTime());
    assert.equal(new Intl.DateTimeFormat("en-GB", { timeZone: "America/New_York", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(w2.dueAt), "Wed 15:00");
    const r = await pushCadence(engagementId, { client: attio.client, env: {} });
    assert.ok(r.moved >= 8, "open tasks follow the new slot");
    assert.equal(attio.tasks.get(w2.attioTaskId!)!.deadline_at, w2.dueAt.toISOString());
    assert.equal((await touch("w1")).dueAt.getTime(), w1.dueAt.getTime(), "the completed touch stayed put");
    assert.equal(attio.tasks.size, TOUCH_KEYS.length, "no duplicates");
  });

  it("a delayed launch rebases every open touch, without duplicating the completed one", async () => {
    const before = await touch("review3");
    await rescheduleStart(engagementId, "2026-11-16", new Date("2026-10-28T12:00:00Z"));
    const after = await touch("review3");
    assert.equal(Math.round((after.dueAt.getTime() - before.dueAt.getTime()) / 86_400_000), 14);
    await pushCadence(engagementId, { client: attio.client, env: {} });
    assert.equal(attio.tasks.get(after.attioTaskId!)!.deadline_at, after.dueAt.toISOString());
    assert.equal(attio.tasks.size, TOUCH_KEYS.length);
    await assert.rejects(rescheduleStart(engagementId, "2026-12-01", new Date("2026-11-20T12:00:00Z")), /already started/);
  });

  it("marking a touch done in the app ticks its Attio task", async () => {
    const day3 = await touch("day3");
    await markTouchDone(day3.id, new Date("2026-11-18T12:00:00Z"));
    const r = await pushCadence(engagementId, { client: attio.client, env: {} });
    assert.equal(r.completedInAttio, 1);
    assert.equal(attio.tasks.get(day3.attioTaskId!)!.is_completed, true);
  });

  it("a pause pushes the rest of the cadence by the paused days", async () => {
    const before = await touch("w6");
    await pauseEngagement(engagementId, new Date("2026-12-01T12:00:00Z"));
    await resumeEngagement(engagementId, new Date("2026-12-08T12:00:00Z"));
    const after = await touch("w6");
    assert.equal(Math.round((after.dueAt.getTime() - before.dueAt.getTime()) / 86_400_000), 7);
    await pushCadence(engagementId, { client: attio.client, env: {} });
    assert.equal(attio.tasks.get(after.attioTaskId!)!.deadline_at, after.dueAt.toISOString());
  });

  it("a task a person deleted in Attio is flagged, not recreated", async () => {
    const w10 = await touch("w10");
    attio.tasks.delete(w10.attioTaskId!);
    const r = await pushCadence(engagementId, { client: attio.client, env: {} });
    assert.equal(r.created, 0);
    assert.ok(r.flagged >= 1);
    assert.match((await touch("w10")).syncError ?? "", /removed in Attio/);
  });

  it("a synthetic (test) workspace never reaches Attio", async () => {
    await prisma.organization.update({ where: { id: orgId }, data: { synthetic: true } });
    const before = attio.tasks.size;
    await prisma.relationshipTouch.updateMany({ where: { engagementId, key: "review3" }, data: { dueAt: new Date("2027-03-01T15:00:00Z") } });
    const r = await pushCadence(engagementId, { client: attio.client, env: {} });
    assert.match(r.held ?? "", /synthetic/);
    assert.equal(attio.tasks.size, before, "nothing created");
    await prisma.organization.update({ where: { id: orgId }, data: { synthetic: false } });
  });

  it("ending the engagement cancels every planned touch and removes the open Attio tasks, keeping completed ones", async () => {
    const completedBefore = [...attio.tasks.values()].filter((t) => t.is_completed).length;
    await endEngagement(engagementId, "terminated", "QA cancellation", new Date("2026-12-10T12:00:00Z"));
    assert.equal(await prisma.relationshipTouch.count({ where: { engagementId, status: "planned" } }), 0);
    const r = await pushCadence(engagementId, { client: attio.client, env: {} });
    assert.ok(r.deleted >= 1);
    assert.equal(openTasks().length, 0, "no open relationship tasks left for a cancelled client");
    assert.equal([...attio.tasks.values()].filter((t) => t.is_completed).length, completedBefore, "history kept");
    const again = await pushCadence(engagementId, { client: attio.client, env: {} });
    assert.deepEqual([again.created, again.deleted, again.moved], [0, 0, 0]);
  });
});
