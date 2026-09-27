import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { prisma } from "@/lib/db/client";
import { loadWorkspaceContext, renderContext } from "@/lib/ai/context";

const stamp = Date.now();
let orgId = "";

before(async () => {
  orgId = (await prisma.organization.create({ data: { slug: `qa-stories-${stamp}`, name: "QA Stories", kind: "client", synthetic: true } })).id;
  await prisma.brandBrain.create({
    data: {
      orgId,
      founder: JSON.stringify({
        name: "Alex Rowe",
        stories: ["The audit that nearly failed", "The client who fired us"],
        approvedAnecdotes: ["The audit that nearly failed"],
      }),
    },
  });
});
after(async () => {
  await prisma.organization.delete({ where: { id: orgId } });
});

describe("founder stories in the AI context", () => {
  it("labels only approved stories as cleared, and marks the rest as background only", async () => {
    const text = renderContext(await loadWorkspaceContext(orgId, { blocks: ["FOUNDER_VOICE"] }), ["FOUNDER_VOICE"]);
    const cleared = text.split("Stories cleared for use:")[1]?.split("Stories mentioned")[0] ?? "";
    assert.match(cleared, /The audit that nearly failed/);
    assert.doesNotMatch(cleared, /The client who fired us/, "an unapproved story must not be presented as cleared");
    assert.match(text, /NOT cleared[^\n]*\n- The client who fired us/);
  });
});
