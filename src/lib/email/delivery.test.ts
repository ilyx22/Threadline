import assert from "node:assert/strict";
import { createHmac, randomBytes } from "node:crypto";
import { after, describe, it } from "node:test";
import { prisma } from "@/lib/db/client";
import { applyResendEvent, isSuppressed, liftSuppression, verifySvix } from "./delivery";
import { sendEmail } from "./index";

const stamp = Date.now();
const addr = (n: string) => `${n}-${stamp}@example.com`;

after(async () => {
  await prisma.emailSuppression.deleteMany({ where: { email: { endsWith: `-${stamp}@example.com` } } });
  await prisma.emailMessage.deleteMany({ where: { toEmail: { endsWith: `-${stamp}@example.com` } } });
});

describe("email delivery events and suppression (NOT-02)", () => {
  it("verifies Svix signatures over id, timestamp and body", () => {
    const key = randomBytes(24);
    const secret = `whsec_${key.toString("base64")}`;
    const body = '{"type":"email.delivered"}';
    const ts = String(Math.floor(Date.now() / 1000));
    const sig = createHmac("sha256", key).update(`msg_1.${ts}.${body}`).digest("base64");
    assert.equal(verifySvix(body, { id: "msg_1", timestamp: ts, signature: `v1,${sig}` }, secret), true);
    assert.equal(verifySvix(body, { id: "msg_1", timestamp: ts, signature: `v1,bad v1,${sig}` }, secret), true, "any listed signature may match");
    assert.equal(verifySvix(body + " ", { id: "msg_1", timestamp: ts, signature: `v1,${sig}` }, secret), false);
    assert.equal(verifySvix(body, { id: "msg_2", timestamp: ts, signature: `v1,${sig}` }, secret), false);
    const old = String(Math.floor(Date.now() / 1000) - 600);
    const oldSig = createHmac("sha256", key).update(`msg_1.${old}.${body}`).digest("base64");
    assert.equal(verifySvix(body, { id: "msg_1", timestamp: old, signature: `v1,${oldSig}` }, secret), false);
  });

  it("a permanent bounce suppresses the address; a temporary one does not; complaints suppress", async () => {
    const sent = await sendEmail({ to: addr("bounce"), template: "application_received", data: { name: "QA" } });
    await prisma.emailMessage.update({ where: { id: sent.id }, data: { providerId: `re_${stamp}` } });
    await applyResendEvent({ type: "email.bounced", data: { email_id: `re_${stamp}`, to: [addr("soft")], bounce: { type: "Transient" } } });
    assert.equal(await isSuppressed(addr("soft")), false);
    await applyResendEvent({ type: "email.bounced", data: { email_id: `re_${stamp}`, to: [addr("bounce")], bounce: { type: "Permanent", subType: "General" } } });
    assert.equal(await isSuppressed(addr("bounce")), true);
    assert.ok((await prisma.emailMessage.findUniqueOrThrow({ where: { id: sent.id } })).bouncedAt);
    await applyResendEvent({ type: "email.complained", data: { to: addr("spam") } });
    assert.equal(await isSuppressed(addr("spam")), true);
  });

  it("never sends to a suppressed address until the suppression is lifted", async () => {
    const r = await sendEmail({ to: addr("bounce"), template: "application_received", data: { name: "QA" } });
    assert.equal(r.status, "suppressed");
    await liftSuppression(addr("bounce"));
    const again = await sendEmail({ to: addr("bounce"), template: "application_received", data: { name: "QA" } });
    assert.notEqual(again.status, "suppressed");
  });
});
