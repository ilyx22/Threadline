import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { after, before, describe, it } from "node:test";
import { prisma } from "@/lib/db/client";
import { beginEnrolment, confirmEnrolment, disableMfa, mfaRequiredForStaff, verifySecondFactor } from "./mfa";
import { codeAt, stepAt } from "./totp";

const saved = process.env.CREDENTIAL_ENCRYPTION_KEYS;
let userId = "";
const email = `mfa-test-${Date.now()}@example.com`;

before(async () => {
  process.env.CREDENTIAL_ENCRYPTION_KEYS = `k1:${randomBytes(32).toString("base64")}`;
  userId = (await prisma.user.create({ data: { email, name: "MFA Test", passwordHash: "x" } })).id;
});
after(async () => {
  await prisma.user.deleteMany({ where: { id: userId } });
  if (saved === undefined) delete process.env.CREDENTIAL_ENCRYPTION_KEYS;
  else process.env.CREDENTIAL_ENCRYPTION_KEYS = saved;
});

describe("staff two-factor (SEC-08)", () => {
  it("is required for staff only in production with a keyring, unless overridden", () => {
    assert.equal(mfaRequiredForStaff({ VERCEL_ENV: "production" }), true);
    assert.equal(mfaRequiredForStaff({ VERCEL_ENV: "preview" }), false);
    assert.equal(mfaRequiredForStaff({ VERCEL_ENV: "production", MFA_STAFF_REQUIRED: "false" }), false);
    assert.equal(mfaRequiredForStaff({ MFA_STAFF_REQUIRED: "true" }), true);
  });

  let secret = "";
  let recovery: string[] = [];
  it("enrols only after a correct first code, storing the secret sealed", async () => {
    ({ secret } = await beginEnrolment(userId, email));
    const row = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    assert.ok(row.mfaSecret && !row.mfaSecret.includes(secret), "secret stored in the clear");
    assert.equal(await confirmEnrolment(userId, "000000"), null);
    recovery = (await confirmEnrolment(userId, codeAt(secret, stepAt(Date.now()))))!;
    assert.equal(recovery.length, 10);
  });

  it("accepts a fresh code once and refuses its replay", async () => {
    // The enrolment code's step is used up; the next step's code is valid (drift window).
    const next = codeAt(secret, stepAt(Date.now()) + 1);
    assert.equal((await verifySecondFactor(userId, next)).ok, true);
    assert.equal((await verifySecondFactor(userId, next)).ok, false);
  });

  it("accepts each recovery code once", async () => {
    const r = await verifySecondFactor(userId, recovery[0]);
    assert.deepEqual([r.ok, r.usedRecovery, r.remainingRecovery], [true, true, 9]);
    assert.equal((await verifySecondFactor(userId, recovery[0])).ok, false);
  });

  it("turns off only with a valid code", async () => {
    assert.equal(await disableMfa(userId, "nonsense"), false);
    assert.equal(await disableMfa(userId, recovery[1]), true);
    const row = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    assert.equal(row.mfaEnabledAt, null);
    assert.equal(row.mfaSecret, null);
  });
});
