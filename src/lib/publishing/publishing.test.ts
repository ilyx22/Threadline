import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { after, afterEach, before, describe, it } from "node:test";
import { prisma } from "@/lib/db/client";
import type { AuthContext } from "@/lib/auth/guard";
import { recordDecision } from "@/lib/delivery/approvals";
import { putCredential } from "@/lib/integrations/credentials";
import { __setConnectorFetch } from "@/lib/integrations/connectors";
import { accessTokenFor, pollPublish, queueDuePublishes, resolveUncertain, runPublish, schedulePublish } from "./index";

const stamp = Date.now();
const saved = { keys: process.env.CREDENTIAL_ENCRYPTION_KEYS, env: process.env.APP_ENV, id: process.env.LINKEDIN_CLIENT_ID, secret: process.env.LINKEDIN_CLIENT_SECRET };
let ctx: AuthContext;
let orgId = "";
let contentId = "";
let packageId = "";
const respond = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

async function record(platform: string, extra: Record<string, unknown> = {}) {
  return prisma.publishRecord.create({ data: { orgId, contentItemId: contentId, packageId, platform, status: "scheduled", method: "integration", scheduledFor: new Date(Date.now() - 1000), ...extra } });
}

before(async () => {
  process.env.CREDENTIAL_ENCRYPTION_KEYS = `k1:${randomBytes(32).toString("base64")}`;
  process.env.APP_ENV = "production";
  const org = await prisma.organization.create({ data: { slug: `qa-pub-${stamp}`, name: "QA Publish", kind: "client", synthetic: true } });
  orgId = org.id;
  const u = await prisma.user.create({ data: { email: `pub-${stamp}@example.com`, name: "Approver", passwordHash: "x" } });
  await prisma.membership.create({ data: { userId: u.id, orgId, role: "client_admin", isOwner: true } });
  ctx = { org: { ...org, startedAt: null }, can: () => true, user: { id: u.id, email: u.email, name: u.name, title: null, avatarHue: 1, isSuperAdmin: false, sessionId: "s", mfaEnabled: false }, role: "client_admin", isInternal: false, profiles: [] } as unknown as AuthContext;
  contentId = (await prisma.contentItem.create({ data: { orgId, title: "A piece", stage: "approved" } as never })).id;
  packageId = (await prisma.platformPackage.create({ data: { orgId, contentItemId: contentId, platform: "linkedin", caption: "The caption", hashtags: '["growth"]' } as never })).id;
  await recordDecision(ctx, { type: "content_item", id: contentId }, "approved");
  await recordDecision(ctx, { type: "platform_package", id: packageId }, "approved");
  for (const provider of ["linkedin", "instagram"]) {
    await prisma.integration.create({ data: { orgId, provider, authStatus: "connected", externalAccountId: "acct-1", status: "configured" } as never });
    await putCredential({ orgId, provider, purpose: "oauth_access", secret: `token-${provider}`, scopes: [], externalAccountId: "acct-1" });
  }
});
afterEach(() => __setConnectorFetch(null));
after(async () => {
  for (const [k, v] of [["CREDENTIAL_ENCRYPTION_KEYS", saved.keys], ["APP_ENV", saved.env], ["LINKEDIN_CLIENT_ID", saved.id], ["LINKEDIN_CLIENT_SECRET", saved.secret]] as const) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  await prisma.job.deleteMany({ where: { orgId } });
  await prisma.approval.deleteMany({ where: { orgId } });
  await prisma.organization.delete({ where: { id: orgId } });
  await prisma.user.delete({ where: { id: ctx.user.id } });
});

describe("scheduled publishing (INT-03, INT-02, JOB-02)", () => {
  it("queues a job at the scheduled time, idempotently", async () => {
    const r = await record("linkedin", { scheduledFor: new Date(Date.now() + 3_600_000) });
    const a = await schedulePublish(r.id);
    const b = await schedulePublish(r.id);
    assert.ok(a && a === b);
    assert.equal((await runPublish(r.id)).state, "early");
    await prisma.publishRecord.delete({ where: { id: r.id } });
  });

  it("publishes text with the approved caption, takes the piece live, and a second run sends nothing", async () => {
    const bodies: string[] = [];
    __setConnectorFetch((async (_u: string | URL, init?: RequestInit) => {
      bodies.push(String(init?.body ?? ""));
      return new Response("", { status: 201, headers: { "x-restli-id": "urn:li:share:1" } });
    }) as typeof fetch);
    const r = await record("linkedin");
    assert.equal((await runPublish(r.id)).state, "published");
    assert.match(bodies[0], /The caption #growth/);
    const after = await prisma.publishRecord.findUniqueOrThrow({ where: { id: r.id } });
    assert.equal(after.status, "published");
    assert.equal((await prisma.contentItem.findUniqueOrThrow({ where: { id: contentId } })).stage, "live");
    assert.equal((await runPublish(r.id)).state, "skipped");
    assert.equal(bodies.length, 1);
  });

  it("refuses at publish time when the approval is no longer current", async () => {
    await prisma.platformPackage.update({ where: { id: packageId }, data: { caption: "Edited after approval" } });
    const r = await record("linkedin");
    assert.equal((await runPublish(r.id)).state, "failed");
    assert.match((await prisma.publishRecord.findUniqueOrThrow({ where: { id: r.id } })).failureReason ?? "", /Not released/);
    await prisma.platformPackage.update({ where: { id: packageId }, data: { caption: "The caption" } });
  });

  it("a timeout after sending is UNCERTAIN, never retried automatically; a person resolves it", async () => {
    __setConnectorFetch((async () => {
      throw new Error("socket hang up");
    }) as typeof fetch);
    const r = await record("linkedin");
    assert.equal((await runPublish(r.id)).state, "uncertain");
    const u = await prisma.publishRecord.findUniqueOrThrow({ where: { id: r.id } });
    assert.deepEqual([u.status, u.providerStatus], ["failed", "UNCERTAIN"]);
    assert.equal((await runPublish(r.id)).state, "skipped", "not sent again");
    assert.equal(await resolveUncertain(orgId, r.id, { posted: true, url: "https://www.linkedin.com/feed/update/urn:li:share:9" }), true);
    assert.equal((await prisma.publishRecord.findUniqueOrThrow({ where: { id: r.id } })).status, "published");
  });

  it("a rate limit releases the claim for a retry; nothing was posted", async () => {
    __setConnectorFetch((async () => new Response("{}", { status: 429, headers: { "retry-after": "30" } })) as typeof fetch);
    const r = await record("linkedin");
    await assert.rejects(runPublish(r.id), /rate limited/);
    const row = await prisma.publishRecord.findUniqueOrThrow({ where: { id: r.id } });
    assert.deepEqual([row.status, row.providerStatus], ["scheduled", null]);
    assert.equal(await queueDuePublishes(), 1);
    await prisma.publishRecord.delete({ where: { id: r.id } });
  });

  it("an Instagram container is polled, then finalised with media_publish", async () => {
    const calls: string[] = [];
    __setConnectorFetch((async (u: string | URL) => {
      const url = String(u);
      calls.push(url);
      if (url.endsWith("/media")) return respond(200, { id: "container9" });
      if (url.includes("container9?fields=status_code")) return respond(200, { status_code: calls.filter((c) => c.includes("status_code")).length > 1 ? "FINISHED" : "IN_PROGRESS" });
      if (url.endsWith("/media_publish")) return respond(200, { id: "media77" });
      return respond(404, {});
    }) as typeof fetch);
    // Media comes from an edited asset; without S3 the run must say so plainly.
    const r = await record("instagram");
    await prisma.asset.create({ data: { orgId, contentItemId: contentId, category: "edited_media", title: "cut", storagePath: `${orgId}/content/x/cut.mp4`, mimeType: "video/mp4" } });
    await recordDecision(ctx, { type: "content_item", id: contentId }, "approved"); // the new cut is what gets approved
    assert.equal((await runPublish(r.id)).state, "failed");
    assert.match((await prisma.publishRecord.findUniqueOrThrow({ where: { id: r.id } })).failureReason ?? "", /S3/);
    // With the container already created, polling finishes the job.
    await prisma.publishRecord.update({ where: { id: r.id }, data: { status: "scheduled", providerStatus: "PROCESSING", externalId: "container9", failureReason: null } });
    assert.equal((await pollPublish(r.id, 1)).state, "processing");
    assert.equal((await pollPublish(r.id, 2)).state, "published");
    const done = await prisma.publishRecord.findUniqueOrThrow({ where: { id: r.id } });
    assert.deepEqual([done.status, done.externalId], ["published", "media77"]);
    assert.ok(calls.some((c) => c.endsWith("/acct-1/media_publish")));
  });

  it("refreshes an expiring token once under a lock and marks reconnect when refresh is refused", async () => {
    process.env.LINKEDIN_CLIENT_ID = "id";
    process.env.LINKEDIN_CLIENT_SECRET = "secret";
    await prisma.integration.update({ where: { orgId_provider: { orgId, provider: "linkedin" } }, data: { tokenExpiresAt: new Date(Date.now() + 60_000) } });
    await assert.rejects(accessTokenFor(orgId, "linkedin"), /reconnect/i, "no refresh token stored");
    const row = await prisma.integration.findUniqueOrThrow({ where: { orgId_provider: { orgId, provider: "linkedin" } } });
    assert.deepEqual([row.authStatus, row.reconnectRequired], ["expired", true]);
  });
});
