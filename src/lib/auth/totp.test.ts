import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { base32Decode, base32Encode, codeAt, consumeRecoveryCode, generateRecoveryCodes, generateSecret, hashRecoveryCode, stepAt, verifyCode } from "./totp";

// RFC 6238 appendix B, SHA-1 seed "12345678901234567890" (8-digit vectors; we use the last 6).
const RFC_SECRET = base32Encode(Buffer.from("12345678901234567890"));

describe("TOTP (SEC-08)", () => {
  it("matches the RFC 6238 test vectors", () => {
    assert.equal(codeAt(RFC_SECRET, stepAt(59_000)), "287082");
    assert.equal(codeAt(RFC_SECRET, stepAt(1_111_111_109_000)), "081804");
    assert.equal(codeAt(RFC_SECRET, stepAt(1_234_567_890_000)), "005924");
    assert.equal(codeAt(RFC_SECRET, stepAt(2_000_000_000_000)), "279037");
  });
  it("round-trips base32 and makes 160-bit secrets", () => {
    const s = generateSecret();
    assert.equal(base32Decode(s).length, 20);
    assert.equal(base32Encode(base32Decode(s)), s);
  });
  it("accepts the adjacent step for clock drift, refuses others and replays", () => {
    const now = 1_700_000_000_000;
    const s = generateSecret();
    const step = stepAt(now);
    assert.equal(verifyCode(s, codeAt(s, step), now), step);
    assert.equal(verifyCode(s, codeAt(s, step - 1), now), step - 1);
    assert.equal(verifyCode(s, codeAt(s, step - 3), now), null);
    assert.equal(verifyCode(s, codeAt(s, step), now, step), null, "the same code twice");
    assert.equal(verifyCode(s, "12345", now), null);
  });
  it("recovery codes work once and are stored only as hashes", () => {
    const codes = generateRecoveryCodes();
    assert.equal(new Set(codes).size, 10);
    const hashes = codes.map(hashRecoveryCode);
    const left = consumeRecoveryCode(hashes, codes[3].toUpperCase());
    assert.equal(left?.length, 9);
    assert.equal(consumeRecoveryCode(left!, codes[3]), null);
  });
});
