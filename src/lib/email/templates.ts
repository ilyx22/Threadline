/**
 * Email templates — plain text first, HTML second. Both are generated from the
 * same content so a client reading text-only mail loses nothing.
 *
 * No client metric, no performance claim and no secret ever appears here.
 * Links carry a token that is single-use and expires (auth/tokens.ts).
 */

export type TemplateMap = {
  invite: { name: string; inviterName: string; workspaceName: string; link: string; expiresInHours: number };
  password_reset: { name: string; link: string; expiresInMinutes: number };
  weekly_report: { name: string; workspaceName: string; periodLabel: string; link: string };
  application_received: { name: string };
  application_operator_alert: { name: string; company: string; urgency: string; link: string };
  period_review: { name: string; workspaceName: string; periodLabel: string; link: string };
  /// BIL-04: written from a draft a person approved; sent as they approved it.
  payment_reminder: { subject: string; body: string };
  notification: { name: string; title: string; body: string; link: string };
  digest: { name: string; workspaceName: string; items: string[]; link: string };
};

export type EmailTemplateKey = keyof TemplateMap;
export type TemplateInput<K extends EmailTemplateKey> = TemplateMap[K];

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function shell(title: string, paragraphs: string[], cta?: { label: string; href: string }, footer = "Threadline · a managed authority system for expert-led firms.") {
  const body = paragraphs.map((p) => `<p style="margin:0 0 14px;font:15px/1.6 -apple-system,Segoe UI,Inter,Arial,sans-serif;color:#1f1d1a">${escape(p)}</p>`).join("");
  const button = cta
    ? `<p style="margin:22px 0"><a href="${escape(cta.href)}" style="display:inline-block;background:#1f1d1a;color:#fbf7ef;text-decoration:none;font:600 14px -apple-system,Segoe UI,Inter,Arial,sans-serif;padding:12px 18px;border-radius:10px">${escape(cta.label)}</a></p><p style="margin:0 0 14px;font:12px/1.5 -apple-system,Segoe UI,Inter,Arial,sans-serif;color:#6f6a62">If the button does not work, paste this into your browser:<br>${escape(cta.href)}</p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#f4efe6;padding:32px 16px"><div style="max-width:560px;margin:0 auto;background:#fffdf8;border:1px solid #e6dfd2;border-radius:16px;padding:32px"><p style="margin:0 0 20px;font:700 13px/1 -apple-system,Segoe UI,Inter,Arial,sans-serif;letter-spacing:.14em;color:#1f1d1a">THREADLINE</p><h1 style="margin:0 0 18px;font:600 22px/1.3 Georgia,'Iowan Old Style',serif;color:#1f1d1a">${escape(title)}</h1>${body}${button}<p style="margin:26px 0 0;font:12px/1.5 -apple-system,Segoe UI,Inter,Arial,sans-serif;color:#8a8479">${escape(footer)}</p></div></body></html>`;
}

function text(title: string, paragraphs: string[], cta?: { label: string; href: string }) {
  return [`THREADLINE`, ``, title, ``, ...paragraphs.flatMap((p) => [p, ""]), ...(cta ? [`${cta.label}: ${cta.href}`, ""] : []), `— Threadline`].join("\n");
}

export function renderTemplate<K extends EmailTemplateKey>(key: K, data: TemplateInput<K>): { subject: string; text: string; html: string } {
  switch (key) {
    case "invite": {
      const d = data as TemplateMap["invite"];
      const title = `${d.inviterName} has added you to ${d.workspaceName} on Threadline`;
      const paragraphs = [
        `Hello ${d.name},`,
        `${d.inviterName} set up a Threadline account for you in the ${d.workspaceName} workspace. Choose a password using the link below — it works once and expires in ${d.expiresInHours} hours.`,
        `If you were not expecting this, you can ignore it; nothing happens until the link is used.`,
      ];
      const cta = { label: "Choose your password", href: d.link };
      return { subject: title, text: text(title, paragraphs, cta), html: shell(title, paragraphs, cta) };
    }
    case "password_reset": {
      const d = data as TemplateMap["password_reset"];
      const title = "Reset your Threadline password";
      const paragraphs = [
        `Hello ${d.name},`,
        `Somebody asked to reset the password for this address. If that was you, use the link below within ${d.expiresInMinutes} minutes. It works once.`,
        `If it was not you, ignore this email — your password has not changed.`,
      ];
      const cta = { label: "Reset password", href: d.link };
      return { subject: title, text: text(title, paragraphs, cta), html: shell(title, paragraphs, cta) };
    }
    case "weekly_report": {
      const d = data as TemplateMap["weekly_report"];
      const title = `${d.workspaceName}: report for ${d.periodLabel} is ready`;
      const paragraphs = [`Hello ${d.name},`, `The report for ${d.periodLabel} has been finalised. It covers what shipped, what we expected, what actually happened and what we are testing next. Sign in to read it.`];
      const cta = { label: "Read the report", href: d.link };
      return { subject: title, text: text(title, paragraphs, cta), html: shell(title, paragraphs, cta) };
    }
    case "application_received": {
      const d = data as TemplateMap["application_received"];
      const title = "We have your application";
      const paragraphs = [`Hello ${d.name},`, `Thank you — your application has arrived and a person will read it. We reply either way, usually within two working days.`];
      return { subject: title, text: text(title, paragraphs), html: shell(title, paragraphs) };
    }
    case "application_operator_alert": {
      const d = data as TemplateMap["application_operator_alert"];
      const title = `New application: ${d.company}`;
      const paragraphs = [`${d.name} at ${d.company} has applied (urgency: ${d.urgency}).`, `Open it to qualify it, set the next action and the owner.`];
      const cta = { label: "Open the application", href: d.link };
      return { subject: title, text: text(title, paragraphs, cta), html: shell(title, paragraphs, cta) };
    }
    case "period_review": {
      const d = data as TemplateMap["period_review"];
      const title = `Your four-week review: ${d.periodLabel}`;
      const paragraphs = [`Hello ${d.name},`, `The review of ${d.periodLabel} for ${d.workspaceName} is ready: what we did, what happened, what got in the way, and what we do next.`];
      const cta = { label: "Read the review", href: d.link };
      return { subject: title, text: text(title, paragraphs, cta), html: shell(title, paragraphs, cta) };
    }
    case "payment_reminder": {
      const d = data as TemplateMap["payment_reminder"];
      const paragraphs = d.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
      return { subject: d.subject, text: text(d.subject, paragraphs), html: shell(d.subject, paragraphs) };
    }
    case "notification": {
      const d = data as TemplateMap["notification"];
      const paragraphs = [`Hello ${d.name},`, d.title, ...(d.body ? [d.body] : [])];
      const cta = { label: "Open Threadline", href: d.link };
      return { subject: d.title, text: text(d.title, paragraphs, cta), html: shell(d.title, paragraphs, cta) };
    }
    case "digest": {
      const d = data as TemplateMap["digest"];
      const title = `Today in ${d.workspaceName}: ${d.items.length} update${d.items.length === 1 ? "" : "s"}`;
      const paragraphs = [`Hello ${d.name},`, ...d.items.map((i) => `• ${i}`), "You chose a daily summary. Change it any time under Account security."];
      const cta = { label: "Open the workspace", href: d.link };
      return { subject: title, text: text(title, paragraphs, cta), html: shell(title, paragraphs, cta) };
    }
    default: {
      const never: never = key;
      throw new Error(`Unknown template ${String(never)}`);
    }
  }
}
