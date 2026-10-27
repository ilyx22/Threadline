import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { prisma } from "@/lib/db/client";
import { loadWorkspaceContext, renderContext } from "@/lib/ai/context";
import { createKnowledgeDoc, restoreKnowledgeVersion, searchKnowledge, setKnowledgeStatus, updateKnowledgeDoc } from ".";

const stamp = Date.now();
// A made-up word so these documents only ever match this test's queries.
const W = `zorblat${stamp % 100000}`;
let orgId = "";
const docIds: string[] = [];

before(async () => {
  orgId = (await prisma.organization.create({ data: { slug: `qa-knowledge-${stamp}`, name: "QA Knowledge", kind: "client", synthetic: true } })).id;
});
after(async () => {
  await prisma.knowledgeDoc.deleteMany({ where: { id: { in: docIds } } });
  await prisma.organization.delete({ where: { id: orgId } });
});

describe("knowledge base (R2)", () => {
  it("versions every save, re-chunks, and restores as a new version", async () => {
    const doc = await createKnowledgeDoc({ title: `Hooks ${W}`, kind: "framework", body: `# Numbers\nLead the ${W} hook with a number.\n\n# Pain\nName the pain.` }, null);
    docIds.push(doc.id);
    assert.equal(await prisma.knowledgeChunk.count({ where: { docId: doc.id } }), 2);

    const v2 = await updateKnowledgeDoc(doc.id, { title: `Hooks ${W}`, kind: "framework", body: `Only one section about ${W}.` }, null);
    assert.equal(v2?.version, 2);
    assert.equal(await prisma.knowledgeChunk.count({ where: { docId: doc.id } }), 1);

    const v3 = await restoreKnowledgeVersion(doc.id, 1, null);
    assert.equal(v3?.version, 3);
    assert.match(v3?.body ?? "", /Lead the/);
    assert.equal(await prisma.knowledgeDocVersion.count({ where: { docId: doc.id } }), 3);
    assert.equal(await prisma.knowledgeChunk.count({ where: { docId: doc.id } }), 2);
  });

  it("search finds matches, respects platform and archive, and always includes style rules", async () => {
    const li = await createKnowledgeDoc({ title: `LinkedIn carousels ${W}`, kind: "framework", platform: "linkedin", body: `Carousels for ${W} open with the result.` }, null);
    const rule = await createKnowledgeDoc({ title: `Style ${W}`, kind: "style_rule", body: "Never use the word synergy." }, null);
    docIds.push(li.id, rule.id);

    const forLinkedin = await searchKnowledge({ query: `${W} carousel`, platform: "linkedin" });
    assert.ok(forLinkedin.some((h) => h.docId === li.id));
    assert.ok(forLinkedin.some((h) => h.docId === rule.id));

    const forYoutube = await searchKnowledge({ query: `${W} carousel`, platform: "youtube" });
    assert.ok(!forYoutube.some((h) => h.docId === li.id));

    await setKnowledgeStatus(li.id, "archived");
    assert.ok(!(await searchKnowledge({ query: W, platform: "linkedin" })).some((h) => h.docId === li.id));
  });

  it("caps chunks per document and the total budget", async () => {
    const big = await createKnowledgeDoc({ title: `Big ${W}`, kind: "course_note", body: Array.from({ length: 6 }, (_, i) => `# Part ${i}\n${W} ${"lesson ".repeat(150)}`).join("\n") }, null);
    docIds.push(big.id);
    const hits = (await searchKnowledge({ query: W, budgetChars: 100_000 })).filter((h) => h.docId === big.id);
    assert.equal(hits.length, 2);
    const small = await searchKnowledge({ query: W, budgetChars: 500 });
    assert.ok(small.reduce((n, h) => n + h.text.length, 0) <= 500);
  });

  it("reaches the prompt as the PLAYBOOK block, with the source named", async () => {
    const context = await loadWorkspaceContext(orgId, { blocks: ["PLAYBOOK"], focus: `${W} hook` });
    const text = renderContext(context, ["PLAYBOOK"]);
    assert.ok(context.used.includes("PLAYBOOK"));
    assert.match(text, /THREADLINE PLAYBOOK/);
    assert.match(text, new RegExp(`\\[Framework: Hooks ${W}`));
  });
});
