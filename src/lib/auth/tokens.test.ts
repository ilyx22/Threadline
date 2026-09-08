import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/db/client";
import { consumeToken, inspectToken, issueToken, tokenLink } from "./tokens";

const EMAIL = "qa.tokens@example.test";
let userId = "";

before(async () => {
  await prisma.user.deleteMany({ where: { email: EMAIL } });
  const u = await prisma.user.create({ data: { email: EMAIL, name: "Token QA", passwordHash: "invited:x" } });
  userId = u.id;
});
after(async () => {
  await prisma.user.deleteMany({ where: { email: EMAIL } });
});

describe("single-use tokens", () => {
  test("issue → inspect → consume once; the second consume is refused as used", async () => {
    const t = await issueToken({ userId, kind: "password_reset" });
    assert.ok(t.raw.length >= 40);
    assert.match(tokenLink("password_reset", t.raw), /\/reset-password\?token=/);
    const peek = await inspectToken(t.raw, "password_reset");
    assert.ok(peek.ok);
    const first = await consumeToken(t.raw, "password_reset");
    assert.ok(first.ok);
    const second = await consumeToken(t.raw, "password_reset");
    assert.ok(!second.ok && second.reason === "used");
  });

  test("the database never holds the raw token", async () => {
    const t = await issueToken({ userId, kind: "invite" });
    const rows = await prisma.authToken.findMany({ where: { userId } });
    assert.ok(rows.every((r) => r.tokenHash !== t.raw && r.tokenHash.length === 64));
  });

  test("wrong kind, garbage and expired tokens are all refused", async () => {
    const t = await issueToken({ userId, kind: "invite" });
    assert.ok(!(await inspectToken(t.raw, "password_reset")).ok);
    assert.ok(!(await inspectToken("nope", "invite")).ok);
    await prisma.authToken.updateMany({ where: { userId, kind: "invite", usedAt: null }, data: { expiresAt: new Date(Date.now() - 1000) } });
    const expired = await inspectToken(t.raw, "invite");
    assert.ok(!expired.ok && expired.reason === "expired");
  });

  test("issuing a new token supersedes the previous unused one of the same kind", async () => {
    const first = await issueToken({ userId, kind: "invite" });
    await issueToken({ userId, kind: "invite" });
    const peek = await inspectToken(first.raw, "invite");
    assert.ok(!peek.ok && peek.reason === "used");
  });
});
