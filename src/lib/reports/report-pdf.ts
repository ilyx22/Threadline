import type { Block } from "./pdf";
import type { WeeklyReportPayload } from "./weekly";

/**
 * The weekly report as PDF blocks (REP-03). It prints what the client sees on
 * the report page from the frozen payload: the same figures, the same claims
 * language, the version and whether it is final. Internal learning detail is
 * not printed.
 */
export function weeklyReportBlocks(input: {
  orgName: string;
  payload: WeeklyReportPayload;
  narrative: string | null;
  status: string;
  version: number;
  finalisedAt: Date | null;
  currency: string;
}): Block[] {
  const p = input.payload;
  const money = (minor: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: input.currency, maximumFractionDigits: 0 }).format(minor / 100);
  const n = (v: number) => v.toLocaleString("en-GB");
  const blocks: Block[] = [
    { kind: "title", text: `${input.orgName}: weekly report` },
    { kind: "small", text: `${p.periodLabel} · version ${input.version} · ${input.status === "final" ? `final${input.finalisedAt ? `, ${input.finalisedAt.toISOString().slice(0, 10)}` : ""}` : "DRAFT, not yet final"}` },
    { kind: "rule" },
  ];
  if (input.narrative) blocks.push({ kind: "h2", text: "Summary" }, { kind: "p", text: input.narrative }, ...(p.isDemoNarrative ? [{ kind: "small" as const, text: "This summary was produced in demo mode, without a live AI model." }] : []));

  blocks.push(
    { kind: "h2", text: "What shipped" },
    { kind: "p", text: `${p.shipped.count} of ${p.shipped.target} planned pieces.${p.shipped.byPlatform.length ? ` ${p.shipped.byPlatform.map((b) => `${b.platform}: ${b.count}`).join(", ")}.` : ""}` },
    ...p.shipped.titles.slice(0, 20).map((t) => ({ kind: "small" as const, text: `- ${t.title} (${t.platform})` })),
    { kind: "h2", text: "Performance" },
    { kind: "p", text: `Views ${n(p.performance.views)}${p.performance.viewsDelta !== null ? ` (${p.performance.viewsDelta >= 0 ? "+" : ""}${Math.round(p.performance.viewsDelta * 100)}% on the previous week)` : ""}; impressions ${n(p.performance.impressions)}; engagements ${n(p.performance.engagements)}.` },
    { kind: "h2", text: "Commercial" },
    { kind: "p", text: `Inquiries ${p.commercial.inquiries}, qualified ${p.commercial.qualified}, calls booked ${p.commercial.callsBooked}, won ${p.commercial.won}${p.attribution.monetaryAllowed ? `, value ${money(p.commercial.valueMinor)}` : ""}.` },
    ...p.attribution.claims.map((c) => ({ kind: "p" as const, text: c.sentence })),
  );
  if (p.attribution.dataQualityNote) blocks.push({ kind: "small", text: p.attribution.dataQualityNote });
  if (p.wins.length) blocks.push({ kind: "h2", text: "What worked" }, ...p.wins.map((w) => ({ kind: "p" as const, text: `${w.title}. ${w.detail}${w.metric ? ` (${w.metric})` : ""}` })));
  if (p.misses.length) blocks.push({ kind: "h2", text: "What did not" }, ...p.misses.map((m) => ({ kind: "p" as const, text: `${m.title}. ${m.detail}` })));
  if (p.learnings.length) blocks.push({ kind: "h2", text: "What we learned" }, ...p.learnings.map((l) => ({ kind: "p" as const, text: `${l.title}. ${l.detail}` })));
  blocks.push(
    { kind: "h2", text: "Next week" },
    ...p.nextWeek.priorities.map((x) => ({ kind: "p" as const, text: `- ${x}` })),
    ...p.nextWeek.tests.map((x) => ({ kind: "p" as const, text: `Test: ${x}` })),
    { kind: "p", text: `Recording planned: ${p.nextWeek.recordingMinutes} minutes.` },
  );
  if (p.clientActions.length) blocks.push({ kind: "h2", text: "What we need from you" }, ...p.clientActions.map((a) => ({ kind: "p" as const, text: `${a.title} (${a.count}, about ${a.estimateMin} min)` })));
  return blocks;
}
