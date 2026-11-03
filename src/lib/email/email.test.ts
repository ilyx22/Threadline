import { test, describe, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/db/client";
import { __setEmailProvider, captureProvider, recentEmails, resendProvider, sendEmail } from "./index";
import { DELIVERABILITY_NOTE, renderTemplate } from "./templates";

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

  test("the invitation states its lifetime in days and does not claim an account already exists", () => {
    const r = renderTemplate("invite", { name: "Ada", inviterName: "Ops", workspaceName: "Northbeam", link: "https://x/i", expiresInHours: 168 });
    assert.ok(r.text.includes("expires in 7 days"));
    assert.ok(!r.text.includes("168 hours"));
    assert.ok(!r.text.includes("set up a Threadline account"));
    assert.ok(renderTemplate("invite", { name: "Ada", inviterName: "Ops", workspaceName: "N", link: "https://x/i", expiresInHours: 72 }).text.includes("expires in 3 days"));
  });

  test("first emails ask the reader to keep us out of junk (S3); routine ones do not", () => {
    const invite = renderTemplate("invite", { name: "Ada", inviterName: "Ops", workspaceName: "Northbeam", link: "https://x/i", expiresInHours: 72 });
    const received = renderTemplate("application_received", { name: "Ada" });
    for (const r of [invite, received]) {
      assert.ok(r.text.includes(DELIVERABILITY_NOTE));
      assert.ok(r.html.includes("mark it as not junk"));
    }
    assert.ok(!renderTemplate("password_reset", { name: "Ada", link: "https://x/r", expiresInMinutes: 30 }).text.includes(DELIVERABILITY_NOTE));
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
