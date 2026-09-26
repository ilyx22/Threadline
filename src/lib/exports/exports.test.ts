import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { prisma } from "@/lib/db/client";
import { __setStorage, MemoryStorageAdapter } from "@/lib/storage";
import { buildExport, expireExports, listExports, requestExport } from "./index";

const stamp = Date.now();
let orgId = "";
let userId = "";
const mem = new MemoryStorageAdapter();

before(async () => {
  __setStorage(mem);
  orgId = (await prisma.organization.create({ data: { slug: `qa-export-${stamp}`, name: "QA Export", kind: "client", synthetic: true } })).id;
  userId = (await prisma.user.create({ data: { email: `export-${stamp}@example.com`, name: "Admin", passwordHash: "x" } })).id;
  await prisma.membership.create({ data: { userId, orgId, role: "client_admin", isOwner: true } });
});
after(async () => {
  __setStorage(null);
  await prisma.job.deleteMany({ where: { orgId } });
  await prisma.dataExport.deleteMany({ where: { orgId } });
  await prisma.organization.delete({ where: { id: orgId } });
  await prisma.user.delete({ where: { id: userId } });
});

describe("on-demand exports (FILE-06)", () => {
  it("builds once, downloads for seven days, then deletes the file and keeps the record", async () => {
    const e = await requestExport(orgId, userId);
    await assert.rejects(requestExport(orgId, userId), /already being prepared/);
    const assetId = await buildExport(e.id);
    assert.ok(assetId);
    assert.equal(await buildExport(e.id), null, "a second run builds nothing");
    const [row] = await listExports(orgId);
    assert.equal(row.status, "ready");
    assert.ok(row.downloadPath && (await mem.exists(row.downloadPath)));
    const json = JSON.parse((await mem.get(row.downloadPath!)).toString("utf8")) as { format: string; workspace: { slug: string } };
    assert.equal(json.format, "threadline-workspace-export/1");
    assert.equal(json.workspace.slug, `qa-export-${stamp}`);
    await assert.rejects(requestExport(orgId, userId), /last hour/);
    assert.equal(await expireExports(new Date(Date.now() + 8 * 86_400_000)), 1);
    const [expired] = await listExports(orgId);
    assert.deepEqual([expired.status, expired.downloadPath], ["expired", null]);
    assert.equal(await mem.exists(row.downloadPath!), false);
    assert.equal(await prisma.asset.count({ where: { id: assetId! } }), 0);
  });
});
