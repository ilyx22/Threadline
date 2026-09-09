import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { prisma } from "@/lib/db/client";
import { ingestWebhook, parseWebhook, verifySignature } from "./webhooks";

const SECRET = "whsec_test";
let orgId = "";

before(async () => {
  await prisma.organization.deleteMany({ where: { slug: "qa-webhook-org" } });
  const org = await prisma.organization.create({ data: { slug: "qa-webhook-org", name: "QA Webhook Org", kind: "client", synthetic: true } });
  orgId = org.id;
});
after(async () => {
  await prisma.webhookEvent.deleteMany({ where: { orgId } });
  await prisma.organization.deleteMany({ where: { id: orgId } });
});

describe("webhook signatures", () => {
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

  test("shared-secret providers: HMAC over the raw body; missing header refused", () => {
    const body = JSON.stringify({ id: "x1", type: "opportunity.won" });
    const sig = createHmac("sha256", SECRET).update(body).digest("hex");
    assert.equal(verifySignature("attio", body, new Headers({ "x-webhook-signature": sig }), SECRET).ok, true);
    assert.equal(verifySignature("attio", body, new Headers(), SECRET).ok, false);
    assert.equal(verifySignature("pipedrive", body + " ", new Headers({ "x-webhook-signature": sig }), SECRET).ok, false);
  });
});

describe("parsing and ingestion", () => {
  test("stripe payment maps to a won event with cash collected; unknown types store without acting", () => {
    const p = parseWebhook("stripe", { id: "evt_2", type: "invoice.paid", created: 1_700_000_000, data: { object: { id: "in_1", amount_paid: 250000, currency: "gbp", customer_details: { email: "buyer@example.test" } } } });
    assert.equal(p?.kind, "won");
    assert.equal(p?.cashCollectedMinor, 250000);
    assert.equal(p?.currency, "GBP");
    const q = parseWebhook("stripe", { id: "evt_3", type: "customer.updated" });
    assert.equal(q?.kind, null);
  });

  test("ingest is idempotent, refuses to act on unverified deliveries, and records provenance without inventing attribution", async () => {
    const parsed = parseWebhook("pipedrive", { meta: { id: "77", action: "updated", object: "deal", timestamp: "1" }, current: { id: "77", status: "won", value: 1200.5, currency: "GBP" } })!;
    const unverified = await ingestWebhook({ provider: "pipedrive", orgId, verified: false, rawBody: "{}", parsed, reason: "signature mismatch" });
    assert.equal(unverified.acted, false);
    assert.equal(unverified.reason, "unverified");
    const first = await ingestWebhook({ provider: "pipedrive", orgId, verified: true, rawBody: "{}", parsed: { ...parsed, externalId: "updated:78:1", externalDealId: "78" } });
    assert.equal(first.acted, true);
    const again = await ingestWebhook({ provider: "pipedrive", orgId, verified: true, rawBody: "{}", parsed: { ...parsed, externalId: "updated:78:1", externalDealId: "78" } });
    assert.equal(again.reason, "duplicate");
    const event = await prisma.commercialEvent.findFirst({ where: { orgId, externalDealId: "78" } });
    assert.equal(event?.source, "crm");
    assert.equal(event?.attribution, "qualitative_only");
    assert.equal(event?.valueMinor, 120050);
  });
});
