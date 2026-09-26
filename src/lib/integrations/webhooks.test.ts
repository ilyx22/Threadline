import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { createHmac, generateKeyPairSync, sign } from "node:crypto";
import { prisma } from "@/lib/db/client";
import { __setGhlPublicKeyForTests, ingestWebhook, parseWebhook, replayProblem, REPLAY_WINDOW_MS, verifySignature } from "./webhooks";

const SECRET = "whsec_test";
let orgId = "";

before(async () => {
  await prisma.organization.deleteMany({ where: { slug: "qa-webhook-org" } });
  const org = await prisma.organization.create({ data: { slug: "qa-webhook-org", name: "QA Webhook Org", kind: "client", synthetic: true } });
  orgId = org.id;
});
after(async () => {
  __setGhlPublicKeyForTests(null);
  await prisma.webhookEvent.deleteMany({ where: { orgId } });
  await prisma.commercialEvent.deleteMany({ where: { orgId } });
  await prisma.organization.deleteMany({ where: { id: orgId } });
});

describe("webhook verification follows each provider's documented contract (SEC-05)", () => {
  test("stripe: valid signature accepted, stale timestamp and wrong secret refused", () => {
    const body = JSON.stringify({ id: "evt_1", type: "payment_intent.succeeded" });
    const t = Math.floor(Date.now() / 1000);
    const v1 = createHmac("sha256", SECRET).update(`${t}.${body}`).digest("hex");
    const good = new Headers({ "stripe-signature": `t=${t},v1=${v1}` });
    assert.equal(verifySignature("stripe", body, good, SECRET).ok, true);
    assert.equal(verifySignature("stripe", body, good, "other").ok, false);
    const old = new Headers({ "stripe-signature": `t=${t - 1000},v1=${createHmac("sha256", SECRET).update(`${t - 1000}.${body}`).digest("hex")}` });
    assert.equal(verifySignature("stripe", body, old, SECRET).ok, false);
  });

  test("attio: hex HMAC of the raw body in Attio-Signature (or the legacy header)", () => {
    const body = JSON.stringify({ webhook_id: "w1", events: [{ event_type: "record.updated", id: { record_id: "r1" } }] });
    const sig = createHmac("sha256", SECRET).update(body).digest("hex");
    assert.equal(verifySignature("attio", body, new Headers({ "attio-signature": sig }), SECRET).ok, true);
    assert.equal(verifySignature("attio", body, new Headers({ "x-attio-signature": sig }), SECRET).ok, true);
    assert.equal(verifySignature("attio", body + " ", new Headers({ "attio-signature": sig }), SECRET).ok, false);
    assert.equal(verifySignature("attio", body, new Headers(), SECRET).ok, false);
  });

  test("pipedrive: basic auth only, since Pipedrive signs nothing", () => {
    const basic = (s: string) => new Headers({ authorization: `Basic ${Buffer.from(s).toString("base64")}` });
    assert.equal(verifySignature("pipedrive", "{}", basic("hook:pa55word"), "hook:pa55word").ok, true);
    assert.equal(verifySignature("pipedrive", "{}", basic("hook:wrong"), "hook:pa55word").ok, false);
    assert.equal(verifySignature("pipedrive", "{}", new Headers(), "hook:pa55word").ok, false);
  });

  test("highlevel: Ed25519 over the body, and the location must be this workspace's", () => {
    const { publicKey, privateKey } = generateKeyPairSync("ed25519");
    __setGhlPublicKeyForTests(publicKey.export({ type: "spki", format: "pem" }).toString());
    const body = JSON.stringify({ type: "OpportunityStatusUpdate", webhookId: "wh1", locationId: "loc_ours", status: "won", timestamp: new Date().toISOString() });
    const sig = sign(null, Buffer.from(body), privateKey).toString("base64");
    assert.equal(verifySignature("gohighlevel", body, new Headers({ "x-ghl-signature": sig }), "loc_ours").ok, true);
    assert.equal(verifySignature("gohighlevel", body, new Headers({ "x-ghl-signature": sig }), "loc_theirs").ok, false);
    assert.equal(verifySignature("gohighlevel", body.replace("won", "lost"), new Headers({ "x-ghl-signature": sig }), "loc_ours").ok, false);
    assert.equal(verifySignature("gohighlevel", body, new Headers(), "loc_ours").ok, false);
  });

  test("replay window on authenticated body timestamps", () => {
    const now = Date.now();
    assert.equal(replayProblem("pipedrive", { meta: { timestamp: Math.floor(now / 1000) } }, now), null);
    assert.ok(replayProblem("pipedrive", { meta: { timestamp: Math.floor((now - REPLAY_WINDOW_MS - 60_000) / 1000) } }, now));
    assert.ok(replayProblem("gohighlevel", { timestamp: new Date(now + 3_600_000).toISOString() }, now));
    assert.ok(replayProblem("gohighlevel", {}, now));
    assert.equal(replayProblem("attio", {}, now), null);
  });
});

describe("parsing and ingestion", () => {
  test("stripe payment maps to a won event with cash collected; unknown types store without acting", () => {
    const p = parseWebhook("stripe", { id: "evt_2", type: "invoice.paid", created: 1_700_000_000, data: { object: { id: "in_1", amount_paid: 250000, currency: "gbp", customer_details: { email: "buyer@example.test" } } } });
    assert.equal(p?.kind, "won");
    assert.equal(p?.cashCollectedMinor, 250000);
    assert.equal(p?.currency, "GBP");
    assert.equal(parseWebhook("stripe", { id: "evt_3", type: "customer.updated" })?.kind, null);
  });

  test("pipedrive v2 payloads use the event id; attio is stored, not acted on", () => {
    const v2 = parseWebhook("pipedrive", { meta: { version: "2.0", id: "e-uuid", entity: "deal", entity_id: "91", action: "change", timestamp: "1700000000" }, data: { status: "won", value: 50, currency: "GBP" } });
    assert.equal(v2?.externalId, "e-uuid");
    assert.equal(v2?.kind, "won");
    assert.equal(v2?.externalDealId, "91");
    const person = parseWebhook("pipedrive", { meta: { version: "2.0", id: "e2", entity: "person", entity_id: "5", action: "change" }, data: { status: "won" } });
    assert.equal(person?.kind, null);
    const attio = parseWebhook("attio", { webhook_id: "w", events: [{ event_type: "record.updated", id: { record_id: "r9" } }] }, new Headers({ "idempotency-key": "idem-1" }));
    assert.equal(attio?.externalId, "idem-1");
    assert.equal(attio?.kind, null);
  });

  test("an unverified delivery never claims the event id, so the genuine one still lands", async () => {
    const parsed = parseWebhook("pipedrive", { meta: { id: "77", action: "updated", object: "deal", timestamp: "1" }, current: { id: "77", status: "won", value: 1200.5, currency: "GBP" } })!;
    const forged = await ingestWebhook({ provider: "pipedrive", orgId, verified: false, rawBody: "{}", parsed, reason: "basic auth mismatch" });
    assert.equal(forged.acted, false);
    assert.equal(forged.reason, "unverified");
    const genuine = await ingestWebhook({ provider: "pipedrive", orgId, verified: true, rawBody: "{}", parsed });
    assert.equal(genuine.acted, true);
  });

  test("verified ingest is idempotent, atomic, and records provenance without inventing attribution", async () => {
    const parsed = parseWebhook("pipedrive", { meta: { id: "78", action: "updated", object: "deal", timestamp: "1" }, current: { id: "78", status: "won", value: 1200.5, currency: "GBP" } })!;
    const [a, b] = await Promise.all([
      ingestWebhook({ provider: "pipedrive", orgId, verified: true, rawBody: "{}", parsed }),
      ingestWebhook({ provider: "pipedrive", orgId, verified: true, rawBody: "{}", parsed }),
    ]);
    assert.deepEqual([a.reason, b.reason].sort(), ["duplicate", "recorded"]);
    const events = await prisma.commercialEvent.findMany({ where: { orgId, externalDealId: "78" } });
    assert.equal(events.length, 1);
    assert.equal(events[0].source, "crm");
    assert.equal(events[0].attribution, "qualitative_only");
    assert.equal(events[0].valueMinor, 120050);
  });
});
