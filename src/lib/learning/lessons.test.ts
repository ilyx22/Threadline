import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { prisma } from "@/lib/db/client";
import { loadWorkspaceContext, renderContext } from "@/lib/ai/context";
import { activateLesson, retireLesson } from "./lessons";

const stamp = Date.now();
let orgId = "";

before(async () => {
  orgId = (await prisma.organization.create({ data: { slug: `qa-lessons-${stamp}`, name: "QA Lessons", kind: "client", synthetic: true } })).id;
});
after(async () => {
  await prisma.generationLesson.deleteMany({ where: { orgId } });
  await prisma.organization.delete({ where: { id: orgId } });
});

describe("lessons in generation (LRN-02)", () => {
  it("needs a confirmed retest or a stated basis", async () => {
    const untested = await prisma.correctionEntry.create({ data: { orgId, believed: "b", actual: "a", failedAssumption: "f", correction: "Lead with the number" } });
    await assert.rejects(activateLesson(orgId, "u", { text: "Lead with the number in the first line", correctionId: untested.id }), /retest confirmed/);
    await assert.rejects(activateLesson(orgId, "u", { text: "Lead with the number in the first line" }), /based on/);
    await prisma.correctionEntry.update({ where: { id: untested.id }, data: { worked: true, verdictNote: "Retention up on two retests" } });
    const l = await activateLesson(orgId, "u", { text: "Lead with the number in the first line", correctionId: untested.id });
    assert.match(l.basis, /Retention up/);
  });

  it("appears in the context, scoped by platform, and disappears when retired", async () => {
    const li = await activateLesson(orgId, "u", { text: "Keep LinkedIn captions under 900 characters", basis: "Three retests", platform: "linkedin" });
    const forYoutube = renderContext(await loadWorkspaceContext(orgId, { blocks: ["LESSONS"], platform: "youtube" }), ["LESSONS"]);
    assert.match(forYoutube, /Lead with the number/);
    assert.doesNotMatch(forYoutube, /900 characters/);
    const forLinkedin = await loadWorkspaceContext(orgId, { blocks: ["LESSONS"], platform: "linkedin" });
    assert.match(renderContext(forLinkedin, ["LESSONS"]), /900 characters \(linkedin only\)/);
    assert.deepEqual(forLinkedin.used, ["LESSONS"]);
    await retireLesson(orgId, li.id, "u", "Platform changed its truncation");
    assert.doesNotMatch(renderContext(await loadWorkspaceContext(orgId, { blocks: ["LESSONS"], platform: "linkedin" }), ["LESSONS"]), /900 characters/);
    await assert.rejects(retireLesson(orgId, li.id, "u", "again"), /not in force/);
  });
});
