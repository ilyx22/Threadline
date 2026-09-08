import { test, describe, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/db/client";
import { __setEmailProvider, captureProvider, recentEmails, resendProvider, sendEmail } from "./index";
import { renderTemplate } from "./templates";

const TO = "qa.email.capture@example.test";

after(async () => {
  await prisma.emailMessage.deleteMany({ where: { toEmail: TO } });
});

describe("email templates", () => {
  test("every template renders text and HTML with the same substance, escapes HTML and carries no secret beyond the link", () => {
    const r = renderTemplate("invite", { name: "Ada <script>", inviterName: "Ops", workspaceName: "Northbeam", link: "https://app.example/invite?token=abc", expiresInHours: 72 });
    assert.ok(r.text.includes("https://app.example/invite?token=abc"));
    assert.ok(r.html.includes("&lt;script&gt;"));
    assert.ok(!r.html.includes("<script>"));
    assert.ok(r.subject.includes("Northbeam"));
    const reset = renderTemplate("password_reset", { name: "Ada", link: "https://x/reset-password?token=t", expiresInMinutes: 30 });
    assert.ok(reset.text.includes("30 minutes"));
  });
});

describe("sending", () => {
  test("capture provider records the message without delivering it", async () => {
    __setEmailProvider(captureProvider);
    const r = await sendEmail({ to: TO, template: "application_received", data: { name: "QA" } });
    assert.equal(r.status, "captured");
    const rows = await recentEmails(TO);
    assert.equal(rows[0]?.status, "captured");
    assert.equal(rows[0]?.provider, "capture");
  });

  test("a provider failure is recorded as failed and surfaced to the caller", async () => {
    __setEmailProvider(resendProvider("key", "Threadline <no-reply@example.test>", async () => new Response("boom", { status: 500 })));
    await assert.rejects(() => sendEmail({ to: TO, template: "application_received", data: { name: "QA" } }), /Resend responded 500/);
    const rows = await recentEmails(TO, 1);
    assert.equal(rows[0]?.status, "failed");
    __setEmailProvider(null);
  });
});
