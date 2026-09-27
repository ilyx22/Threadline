import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { envChoice, configReport } from "@/lib/env";
import { s3ConfigFromEnv } from "@/lib/storage/s3";
import { emailDeliveryConfigured, resendProvider } from "./index";

/**
 * Vercel keeps variables saved with empty values. Production had
 * EMAIL_PROVIDER, STORAGE_PROVIDER and the S3_* variables saved blank, and a
 * blank provider must mean "not configured", never a live service.
 */
describe("blank provider settings count as unset", () => {
  const blanks = ["", "   ", "\t"];

  it("envChoice falls back for blank and whitespace-only values, and trims real ones", () => {
    for (const b of blanks) assert.equal(envChoice(b, "capture"), "capture");
    assert.equal(envChoice(undefined, "local"), "local");
    assert.equal(envChoice(" resend ", "capture"), "resend");
  });

  it("a blank EMAIL_PROVIDER is not reported as live email delivery", () => {
    for (const b of blanks) assert.equal(emailDeliveryConfigured({ EMAIL_PROVIDER: b }), false, JSON.stringify(b));
    assert.equal(emailDeliveryConfigured({}), false);
    assert.equal(emailDeliveryConfigured({ EMAIL_PROVIDER: "resend" }), true);
  });

  it("the configuration report treats blank email and storage providers as unset on a Vercel production deployment", () => {
    for (const b of blanks) {
      const issues = configReport({ VERCEL: "1", VERCEL_ENV: "production", DATABASE_URL: "postgresql://u:p@db.example.net/app", EMAIL_PROVIDER: b, STORAGE_PROVIDER: b, RATE_LIMIT_STORE: b }).issues;
      const email = issues.find((i) => i.name === "EMAIL_PROVIDER");
      assert.ok(email && email.level === "warning" && email.message.includes('"capture"'), "blank email provider reads as capture");
      assert.ok(issues.some((i) => i.name === "STORAGE_PROVIDER" && i.level === "error"), "blank storage provider is local, refused on Vercel");
      assert.ok(issues.some((i) => i.name === "RATE_LIMIT_STORE" && i.level === "warning"), "blank rate-limit store is memory");
    }
  });

  it("Resend sends reply_to only when a reply address is configured", async () => {
    const bodies: Record<string, unknown>[] = [];
    const fake = (async (_u: string | URL, init?: RequestInit) => {
      bodies.push(JSON.parse(String(init?.body)));
      return new Response(JSON.stringify({ id: "e1" }), { status: 200 });
    }) as typeof fetch;
    const msg = { to: "a@example.test", subject: "s", text: "t", html: "<p>t</p>" };
    await resendProvider("k", "Threadline <hello@mail.example.test>", fake, "hello@example.test").send(msg as never);
    await resendProvider("k", "Threadline <hello@mail.example.test>", fake).send(msg as never);
    assert.deepEqual(bodies[0].reply_to, ["hello@example.test"]);
    assert.equal("reply_to" in bodies[1], false);
  });

  it("whitespace-only S3 variables do not make an S3 configuration", () => {
    const full = { S3_BUCKET: "b", S3_REGION: "auto", S3_ACCESS_KEY_ID: "id", S3_SECRET_ACCESS_KEY: "secret", S3_ENDPOINT: "https://x.r2.cloudflarestorage.com/" };
    assert.equal(s3ConfigFromEnv({ ...full, S3_BUCKET: "  " } as unknown as NodeJS.ProcessEnv), null);
    assert.equal(s3ConfigFromEnv({ ...full, S3_SECRET_ACCESS_KEY: "" } as unknown as NodeJS.ProcessEnv), null);
    assert.equal(s3ConfigFromEnv(full as unknown as NodeJS.ProcessEnv)?.endpoint, "https://x.r2.cloudflarestorage.com");
  });
});
