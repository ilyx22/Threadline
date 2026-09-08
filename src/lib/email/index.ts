import "server-only";
import { prisma } from "@/lib/db/client";
import { renderTemplate, type EmailTemplateKey, type TemplateInput } from "./templates";

/**
 * Transactional email.
 *
 * Provider is chosen by `EMAIL_PROVIDER`:
 *   capture (default) — writes the rendered message to `EmailMessage` and
 *                       nothing leaves the box. Development, tests, staging.
 *   resend            — Resend's HTTP API over `fetch` (RESEND_API_KEY, EMAIL_FROM).
 *
 * Every send, whichever provider, is recorded in `EmailMessage` with its
 * status, so "did the invite go out?" has an answer that is not a log grep.
 * Bodies never contain a raw secret: tokens are embedded only inside links
 * that expire and are single-use (see `auth/tokens.ts`).
 */

export type EmailProvider = {
  readonly name: "capture" | "resend";
  send(message: RenderedEmail): Promise<{ ok: true; providerId?: string } | { ok: false; error: string }>;
};

export type RenderedEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
  template: EmailTemplateKey;
};

export const captureProvider: EmailProvider = {
  name: "capture",
  async send() {
    return { ok: true, providerId: `captured-${Date.now()}` };
  },
};

export function resendProvider(apiKey: string, from: string, fetchImpl: typeof fetch = fetch): EmailProvider {
  return {
    name: "resend",
    async send(message) {
      const res = await fetchImpl("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [message.to], subject: message.subject, text: message.text, html: message.html }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        return { ok: false, error: `Resend responded ${res.status}: ${body.slice(0, 200)}` };
      }
      const json = (await res.json().catch(() => ({}))) as { id?: string };
      return { ok: true, providerId: json.id };
    },
  };
}

let provider: EmailProvider | null = null;

export function configuredEmailProvider(): EmailProvider {
  if (provider) return provider;
  const mode = process.env.EMAIL_PROVIDER ?? "capture";
  if (mode === "resend") {
    const key = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    if (!key || !from) throw new Error("EMAIL_PROVIDER=resend needs RESEND_API_KEY and EMAIL_FROM");
    provider = resendProvider(key, from);
  } else {
    provider = captureProvider;
  }
  return provider;
}

/** Test seam. */
export function __setEmailProvider(next: EmailProvider | null) {
  provider = next;
}

/** Whether real delivery is configured — surfaced in the UI so nobody waits for an email that was only captured. */
export function emailDeliveryConfigured() {
  return (process.env.EMAIL_PROVIDER ?? "capture") !== "capture";
}

export async function sendEmail<K extends EmailTemplateKey>(input: {
  to: string;
  template: K;
  data: TemplateInput<K>;
  orgId?: string | null;
  jobId?: string | null;
}) {
  const rendered = renderTemplate(input.template, input.data);
  const p = configuredEmailProvider();
  const row = await prisma.emailMessage.create({
    data: {
      orgId: input.orgId ?? null,
      toEmail: input.to.toLowerCase(),
      template: input.template,
      subject: rendered.subject,
      textBody: rendered.text,
      htmlBody: rendered.html,
      provider: p.name,
      status: "queued",
      jobId: input.jobId ?? null,
    },
  });
  const result = await p.send({ to: input.to, template: input.template, ...rendered });
  await prisma.emailMessage.update({
    where: { id: row.id },
    data: result.ok
      ? { status: p.name === "capture" ? "captured" : "sent", providerId: result.providerId ?? null, sentAt: new Date() }
      : { status: "failed", error: result.error.slice(0, 500) },
  });
  if (!result.ok) throw new Error(result.error);
  return { id: row.id, status: p.name === "capture" ? ("captured" as const) : ("sent" as const) };
}

/** Recent captured/sent mail for an address — used by tests and the dev mail viewer. */
export async function recentEmails(to: string, limit = 10) {
  return prisma.emailMessage.findMany({ where: { toEmail: to.toLowerCase() }, orderBy: { createdAt: "desc" }, take: limit });
}
