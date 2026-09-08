import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { describe, it, before, after } from "node:test";
import {
  credentialAad,
  credentialStorageConfigured,
  generateKeyMaterial,
  needsRotation,
  open,
  safeEqual,
  seal,
  SecretKeyError,
} from "./secret-box";

/**
 * The rules these tests protect:
 *
 *   1. ciphertext is never the plaintext, and never stable across writes;
 *   2. tampering with any part of a sealed secret fails loudly;
 *   3. a credential sealed for one tenant cannot be opened as another's —
 *      a database mix-up must not become a cross-tenant credential leak;
 *   4. a missing key throws rather than falling back to a known constant;
 *   5. key rotation keeps old secrets readable.
 */

const KEY_A = randomBytes(32).toString("base64");
const KEY_B = randomBytes(32).toString("base64");

let original: string | undefined;

before(() => {
  original = process.env.CREDENTIAL_ENCRYPTION_KEYS;
  process.env.CREDENTIAL_ENCRYPTION_KEYS = `k1:${KEY_A}`;
});

after(() => {
  if (original === undefined) delete process.env.CREDENTIAL_ENCRYPTION_KEYS;
  else process.env.CREDENTIAL_ENCRYPTION_KEYS = original;
});

const AAD = credentialAad("org_1", "linkedin", "oauth");

describe("sealing a secret", () => {
  it("does not store the plaintext", () => {
    const token = "refresh-token-that-would-let-somebody-post-as-the-client";
    const sealed = seal(token, AAD);
    const blob = JSON.stringify(sealed);
    assert.doesNotMatch(blob, /refresh-token/);
    assert.doesNotMatch(blob, /client/);
  });

  it("produces different ciphertext every time", () => {
    // A fresh nonce per write. Reusing one under the same key breaks GCM
    // completely, so identical inputs must never produce identical output.
    const a = seal("same", AAD);
    const b = seal("same", AAD);
    assert.notEqual(a.ciphertext, b.ciphertext);
    assert.notEqual(a.nonce, b.nonce);
  });

  it("round-trips exactly", () => {
    const secret = "ya29.a0-Example_Token.with-punctuation/and+base64==";
    assert.equal(open(seal(secret, AAD), AAD), secret);
  });

  it("round-trips unicode and empty strings", () => {
    assert.equal(open(seal("", AAD), AAD), "");
    assert.equal(open(seal("naïve — ünïcode ✓", AAD), AAD), "naïve — ünïcode ✓");
  });

  it("records which key sealed it", () => {
    assert.equal(seal("x", AAD).keyId, "k1");
  });
});

describe("tampering", () => {
  it("refuses altered ciphertext", () => {
    const sealed = seal("token", AAD);
    const bytes = Buffer.from(sealed.ciphertext, "base64url");
    bytes[0] ^= 0xff;
    assert.throws(() =>
      open({ ...sealed, ciphertext: bytes.toString("base64url") }, AAD),
    );
  });

  it("refuses an altered auth tag", () => {
    const sealed = seal("token", AAD);
    const tag = Buffer.from(sealed.tag, "base64url");
    tag[0] ^= 0xff;
    assert.throws(() => open({ ...sealed, tag: tag.toString("base64url") }, AAD));
  });

  it("refuses a malformed nonce", () => {
    const sealed = seal("token", AAD);
    assert.throws(() => open({ ...sealed, nonce: "AAAA" }, AAD), SecretKeyError);
  });

  it("refuses an unknown format version", () => {
    const sealed = seal("token", AAD);
    assert.throws(() => open({ ...sealed, v: 99 }, AAD), SecretKeyError);
  });
});

describe("tenant binding", () => {
  it("cannot be opened as a different organisation", () => {
    // The scenario this prevents: a sealed blob copied into another tenant's
    // row. Without the AAD binding it would decrypt perfectly.
    const sealed = seal("org-1-token", credentialAad("org_1", "linkedin", "oauth"));
    assert.throws(() => open(sealed, credentialAad("org_2", "linkedin", "oauth")));
  });

  it("cannot be opened as a different provider", () => {
    const sealed = seal("token", credentialAad("org_1", "linkedin", "oauth"));
    assert.throws(() => open(sealed, credentialAad("org_1", "tiktok", "oauth")));
  });

  it("cannot be opened for a different purpose", () => {
    const sealed = seal("token", credentialAad("org_1", "linkedin", "oauth"));
    assert.throws(() => open(sealed, credentialAad("org_1", "linkedin", "webhook")));
  });
});

describe("keys", () => {
  it("refuses to seal without a key", () => {
    const saved = process.env.CREDENTIAL_ENCRYPTION_KEYS;
    delete process.env.CREDENTIAL_ENCRYPTION_KEYS;
    try {
      // Fail closed. A store that silently encrypts with a constant looks like
      // it is working, which is worse than refusing.
      assert.throws(() => seal("token", AAD), SecretKeyError);
      assert.equal(credentialStorageConfigured(), false);
    } finally {
      process.env.CREDENTIAL_ENCRYPTION_KEYS = saved;
    }
  });

  it("rejects a key of the wrong length", () => {
    const saved = process.env.CREDENTIAL_ENCRYPTION_KEYS;
    process.env.CREDENTIAL_ENCRYPTION_KEYS = `short:${Buffer.from("too short").toString("base64")}`;
    try {
      assert.throws(() => seal("token", AAD), SecretKeyError);
    } finally {
      process.env.CREDENTIAL_ENCRYPTION_KEYS = saved;
    }
  });

  it("keeps old secrets readable after rotation", () => {
    const saved = process.env.CREDENTIAL_ENCRYPTION_KEYS;
    try {
      const old = seal("written-before-rotation", AAD);

      // Rotate: new key first, old key retained.
      process.env.CREDENTIAL_ENCRYPTION_KEYS = `k2:${KEY_B},k1:${KEY_A}`;

      assert.equal(open(old, AAD), "written-before-rotation", "old secret must survive rotation");
      assert.equal(needsRotation(old), true, "and be flagged for re-sealing");
      assert.equal(seal("new", AAD).keyId, "k2", "new writes use the newest key");
      assert.equal(needsRotation(seal("new", AAD)), false);
    } finally {
      process.env.CREDENTIAL_ENCRYPTION_KEYS = saved;
    }
  });

  it("fails clearly when the sealing key has been removed entirely", () => {
    const saved = process.env.CREDENTIAL_ENCRYPTION_KEYS;
    try {
      const sealed = seal("token", AAD);
      process.env.CREDENTIAL_ENCRYPTION_KEYS = `k2:${KEY_B}`;
      assert.throws(() => open(sealed, AAD), /reconnect the account/);
    } finally {
      process.env.CREDENTIAL_ENCRYPTION_KEYS = saved;
    }
  });

  it("generates keys of the right size", () => {
    assert.equal(Buffer.from(generateKeyMaterial(), "base64").length, 32);
  });
});

describe("safeEqual", () => {
  it("matches identical strings and rejects everything else", () => {
    assert.equal(safeEqual("abc123", "abc123"), true);
    assert.equal(safeEqual("abc123", "abc124"), false);
    assert.equal(safeEqual("abc", "abcd"), false);
    assert.equal(safeEqual("", ""), true);
  });
});
