/**
 * HOMEPAGE ACCEPTANCE — the 24 September 2026 rebuild, against QA_BASE
 * (default :3000). Structure, the protected copy, the two interactive
 * pieces (mouse and keyboard), widths 320–1440 without horizontal overflow,
 * the server HTML without scripting, reduced motion, and the claims rules.
 *
 *   node scripts/qa/run.cjs marketing-home
 */
import path from "node:path";
import { record, section, summary } from "./context";
import { evaluate, launchChrome, open, setViewport, sleep } from "./cdp";

const BASE = (process.env.QA_BASE ?? "http://localhost:3000").replace(/\/$/, "");
const q = (selector: string) => `document.querySelector(${JSON.stringify(selector)})`;

async function main() {
  const { cdp, close } = await launchChrome({ port: 9383, profileDir: path.resolve("scripts/qa/.shots/marketing-home/.chrome-profile") });
  const ok = (area: string, feature: string, condition: boolean, detail = "") => record(area, feature, condition ? "PASS" : "FAIL", detail, condition ? undefined : "MARKETING-HOME");
  try {
    section("homepage — story and copy");
    await setViewport(cdp, 1440, 900);
    await open(cdp, `${BASE}/`, 1800);
    const s = await evaluate<{ sections: number; h1: string; text: string; stations: number; loopTabs: number; cases: number; sheets: number; cartoon: number; js: string }>(cdp, `({
      sections: document.querySelectorAll('.h-home > section').length,
      h1: document.querySelector('h1')?.textContent || '',
      text: document.body.innerText,
      stations: document.querySelectorAll('.h-rail [role=tab]').length,
      loopTabs: document.querySelectorAll('.h-loop-tabs [role=tab]').length,
      cases: document.querySelectorAll('.h-loop-cases .h-chip').length,
      sheets: document.querySelectorAll('.h-sheet').length,
      cartoon: document.querySelectorAll('.v5-stage,.v5-bench,.v5-art,.v9-home,.v8-home').length,
      js: document.documentElement.dataset.js || ''
    })`);
    ok("home:story", "nine sections: eight parts and the closing", s.sections === 9, `${s.sections}`);
    ok("home:copy", "approved hero proposition", /expertise that wins the work visible before the sales call/i.test(s.h1), s.h1);
    ok("home:copy", "inside the firm and what the market sees", /inside the firm/i.test(s.text) && /what the market sees/i.test(s.text));
    ok("home:copy", "market memory idea", /familiar to the people who matter/i.test(s.text));
    ok("home:copy", "founder role", /talk, record when useful, approve and sell/i.test(s.text));
    ok("home:copy", "the workshop and the loop", /authority workshop/i.test(s.text) && /Expected\. Actual\.\s+Why\. Change\. Retest\./.test(s.text));
    ok("home:copy", "one idea, the right expressions", /One idea, the right expressions/.test(s.text));
    ok("home:design", "six workshop stations, five loop states, three cases", s.stations === 6 && s.loopTabs === 5 && s.cases === 3, JSON.stringify({ stations: s.stations, loopTabs: s.loopTabs, cases: s.cases }));
    ok("home:design", "paper sheets carry the objects", s.sheets >= 12, `${s.sheets}`);
    ok("home:design", "no cartoon or superseded components", s.cartoon === 0, `${s.cartoon}`);
    ok("home:design", "scripting flag set by the observer", s.js === "1");

    section("homepage — interaction");
    await evaluate(cdp, `${q(".h-rail [role=tab]:nth-child(4)")}.click(); true`);
    await sleep(150);
    const ws = await evaluate<{ on: string; visible: number; label: string }>(cdp, `({ on: ${q(".h-workshop")}.dataset.on, visible: [...document.querySelectorAll('.h-workshop-panel')].filter(p => getComputedStyle(p).display !== 'none').length, label: ${q(".h-workshop-panel.is-on .h-label")}.textContent })`);
    ok("home:workshop", "choosing a station shows that station only", ws.on === "3" && ws.visible === 1 && /04/.test(ws.label), JSON.stringify(ws));
    await evaluate(cdp, `(() => { const t = ${q(".h-rail [role=tab][aria-selected=true]")}; t.focus(); t.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); return true; })()`);
    await sleep(120);
    const key = await evaluate<{ on: string; focused: string }>(cdp, `({ on: ${q(".h-workshop")}.dataset.on, focused: document.activeElement?.id || '' })`);
    ok("home:workshop", "arrow key moves the station and focus", key.on === "4" && /ws-tab-read/.test(key.focused), JSON.stringify(key));
    await evaluate(cdp, `(() => { const t = ${q(".h-rail [role=tab][aria-selected=true]")}; t.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true })); return true; })()`);
    await sleep(120);
    ok("home:workshop", "Home returns to the first station", (await evaluate<string>(cdp, `${q(".h-workshop")}.dataset.on`)) === "0");
    const before = await evaluate<string>(cdp, `${q(".h-ledger-table tbody tr td:nth-child(3)")}.textContent`);
    await evaluate(cdp, `${q(".h-loop-tabs [role=tab]:nth-child(2)")}.click(); true`);
    await sleep(150);
    const after = await evaluate<{ v: string; state: string; verdict: string }>(cdp, `({ v: ${q(".h-ledger-table tbody tr td:nth-child(3)")}.textContent, state: ${q(".h-loop")}.dataset.state, verdict: ${q(".h-ledger-verdict")}.textContent })`);
    ok("home:loop", "the Actual state fills the ledger", before.trim() === "—" && after.state === "1" && /\d/.test(after.v) && /came back/i.test(after.verdict), JSON.stringify({ before, after }));
    await evaluate(cdp, `${q(".h-loop-cases .h-chip:nth-of-type(2)")}.click(); true`);
    await sleep(120);
    const sw = await evaluate<{ state: string; title: string }>(cdp, `({ state: ${q(".h-loop")}.dataset.state, title: ${q(".h-ledger .h-sheet-head .h-label")}.textContent })`);
    ok("home:loop", "choosing a case resets to Expected and renames the ledger", sw.state === "0" && /wrong audience/i.test(sw.title), JSON.stringify(sw));
    await evaluate(cdp, `(() => { const t = ${q(".h-loop-tabs [role=tab][aria-selected=true]")}; t.focus(); t.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true })); return true; })()`);
    await sleep(120);
    ok("home:loop", "End reaches Retest with focus", (await evaluate<string>(cdp, `${q(".h-loop")}.dataset.state + ':' + (document.activeElement?.id || '')`)) === "4:loop-tab-4");

    section("homepage — widths and clipping");
    for (const width of [1440, 1024, 768, 390, 320]) {
      await setViewport(cdp, width, 900);
      await open(cdp, `${BASE}/`, 1200);
      const w = await evaluate<{ sw: number; iw: number; wide: string[]; clipped: string[] }>(cdp, `(() => {
        const iw = innerWidth;
        const wide = [...document.querySelectorAll('.h-home *')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > iw + 1; }).slice(0, 4).map(e => e.tagName.toLowerCase() + '.' + [...e.classList].slice(0, 2).join('.'));
        const clipped = [...document.querySelectorAll('.h-sheet-title, .h-h1, .h-h2, .h-rail-title, .h-ledger-verdict, .h-label, .h-encounter-state, .h-form-role')].filter(e => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== 'visible').slice(0, 4).map(e => e.textContent.trim().slice(0, 30));
        return { sw: document.documentElement.scrollWidth, iw, wide, clipped };
      })()`);
      ok("home:widths", `no horizontal overflow at ${width}px`, w.sw <= w.iw + 1 && w.wide.length === 0, JSON.stringify(w));
      ok("home:widths", `no clipped headings or labels at ${width}px`, w.clipped.length === 0, w.clipped.join(" | "));
      if (width === 320 || width === 390) {
        const taps = await evaluate<number>(cdp, `[...document.querySelectorAll('.h-home a, .h-home button')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.height < 40 || r.width < 40); }).length`);
        ok("home:widths", `tap targets at ${width}px are at least 40px`, taps === 0, `${taps} small targets`);
      }
    }

    section("homepage — without scripting, reduced motion, claims");
    const html = await (await fetch(`${BASE}/`)).text();
    ok("home:nojs", "all six station sheets are in the server HTML", (html.match(/ws-panel-/g) || []).length >= 6);
    ok("home:nojs", "the Expected ledger is in the server HTML", /What we expected/.test(html) && /h-ledger-table/.test(html));
    ok("home:nojs", "the five encounters are in the server HTML", (html.match(/h-encounter-state/g) || []).length >= 5);
    await setViewport(cdp, 1440, 900);
    await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    await open(cdp, `${BASE}/`, 1200);
    const rm = await evaluate<{ running: number; hidden: number }>(cdp, `(() => {
      const els = [...document.querySelectorAll('.h-home *')];
      return { running: els.filter(e => { const a = getComputedStyle(e).animationName; return a && a !== 'none'; }).length, hidden: els.filter(e => e.matches('.h-sheet, h1, h2') && parseFloat(getComputedStyle(e).opacity) < 0.99).length };
    })()`);
    ok("home:motion", "reduced motion runs no animation and hides nothing", rm.running === 0 && rm.hidden === 0, JSON.stringify(rm));
    await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
    const text = await evaluate<string>(cdp, `document.body.innerText`);
    ok("home:claims", "no exact pricing", !/£\s?\d|\$\s?\d|starting from|per month|\/month/i.test(text));
    ok("home:claims", "no promised outcomes", !/guarantee[ds]? (leads|calls|revenue|results)|go viral|10x/i.test(text));
    ok("home:claims", "illustrative material is labelled", (text.match(/illustrative/gi) || []).length >= 3);
    ok("home:claims", "AI is not the public category", !/\bAI\b|artificial intelligence/.test(text));
  } finally {
    close();
  }
  const r = summary();
  console.log(`\nmarketing-home: pass=${r.pass} partial=${r.partial} fail=${r.fail} na=${r.na}`);
  process.exit(r.fail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
