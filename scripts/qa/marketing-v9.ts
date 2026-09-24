/**
 * HOMEPAGE ACCEPTANCE — the 24 September 2026 second pass (v9), against
 * QA_BASE (default :3000). Structure, the protected copy, the bench and its
 * keyboard, widths 320–1440 without horizontal overflow, the server HTML
 * without scripting, reduced motion, and the claims rules.
 *
 *   node scripts/qa/run.cjs marketing-v9
 */
import path from "node:path";
import { record, section, summary } from "./context";
import { evaluate, launchChrome, open, setViewport, sleep } from "./cdp";

const BASE = (process.env.QA_BASE ?? "http://localhost:3000").replace(/\/$/, "");
const q = (selector: string) => `document.querySelector(${JSON.stringify(selector)})`;

async function main() {
  const { cdp, close } = await launchChrome({ port: 9384, profileDir: path.resolve("scripts/qa/.shots/marketing-v9/.chrome-profile") });
  const ok = (area: string, feature: string, condition: boolean, detail = "") => record(area, feature, condition ? "PASS" : "FAIL", detail, condition ? undefined : "MARKETING-V9");
  try {
    section("homepage v9 — story and copy");
    await setViewport(cdp, 1440, 900);
    await open(cdp, `${BASE}/`, 1800);
    const s = await evaluate<{ sections: number; h1: string; text: string; tiles: number; scenes: number; tabs: number; cases: number; js: string; hidden: number }>(cdp, `({
      sections: document.querySelectorAll('.v9-home > section').length,
      h1: document.querySelector('h1')?.textContent || '',
      text: document.body.innerText,
      tiles: document.querySelectorAll('.v9-mosaic-tile').length,
      scenes: document.querySelectorAll('.v9-home svg[role=img][aria-label]').length,
      tabs: document.querySelectorAll('.v5-tabs [role=tab]').length,
      cases: document.querySelectorAll('.v5-cases .v5-chip').length,
      js: document.documentElement.dataset.js || '',
      hidden: [...document.querySelectorAll('.v9-home h1, .v9-home h2, .v9-home .v5-art')].filter(e => parseFloat(getComputedStyle(e).opacity) < 0.99 && !e.closest('[data-scene]:not([data-seen])')).length
    })`);
    ok("v9:story", "ten sections: hero, ticker, gap, memory, roles, workshop, expressions, learning, fit, closing", s.sections === 10, `${s.sections}`);
    ok("v9:copy", "approved hero proposition", /expertise that wins the work visible before the sales call/i.test(s.h1), s.h1);
    ok("v9:copy", "inside the firm and what the market sees", /inside the firm/i.test(s.text) && /what the market sees/i.test(s.text));
    ok("v9:copy", "market memory idea", /familiar to the people who matter/i.test(s.text));
    ok("v9:copy", "founder role", /talk, record when useful, approve and sell/i.test(s.text));
    ok("v9:copy", "the workshop and the loop", /six stations/i.test(s.text) && /Expected\. Actual\.\s+Why\. Change\. Retest\./.test(s.text));
    ok("v9:copy", "one idea, the right expressions", /One idea, the right expressions/.test(s.text));
    ok("v9:design", "six mosaic tiles, five bench states, three cases", s.tiles === 6 && s.tabs === 5 && s.cases === 3, JSON.stringify({ tiles: s.tiles, tabs: s.tabs, cases: s.cases }));
    ok("v9:design", "every scene is a labelled illustration", s.scenes >= 14, `${s.scenes}`);
    ok("v9:design", "scripting flag set by the observer", s.js === "1");
    ok("v9:design", "nothing in a seen scene is hidden", s.hidden === 0, `${s.hidden}`);

    section("homepage v9 — the bench");
    await evaluate(cdp, `${q("#learning")}.scrollIntoView(); true`);
    await sleep(400);
    await evaluate(cdp, `${q(".v5-tabs [role=tab]:nth-child(2)")}.click(); true`);
    await sleep(200);
    const b = await evaluate<{ state: string; verdict: string }>(cdp, `({ state: ${q(".v5-bench")}.dataset.state, verdict: ${q(".v5-readout-verdict")}.textContent })`);
    ok("v9:bench", "the Actual state reads on the bench", b.state === "1" && /Actual/.test(b.verdict), JSON.stringify(b));
    await evaluate(cdp, `(() => { const t = ${q(".v5-tabs [role=tab][aria-selected=true]")}; t.focus(); t.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); return true; })()`);
    await sleep(150);
    ok("v9:bench", "arrow key moves the state and focus", (await evaluate<string>(cdp, `${q(".v5-bench")}.dataset.state + ':' + (document.activeElement?.id || '')`)) === "2:bench-tab-2");
    await evaluate(cdp, `${q(".v5-cases .v5-chip:nth-child(3)")}.click(); true`);
    await sleep(150);
    ok("v9:bench", "choosing a case resets to Expected", (await evaluate<string>(cdp, `${q(".v5-bench")}.dataset.state`)) === "0");

    section("homepage v9 — widths and clipping");
    for (const width of [1440, 1024, 768, 390, 320]) {
      await setViewport(cdp, width, 900);
      await open(cdp, `${BASE}/`, 1200);
      const w = await evaluate<{ sw: number; iw: number; wide: string[]; clipped: string[] }>(cdp, `(() => {
        const iw = innerWidth;
        const wide = [...document.querySelectorAll('.v9-home *')].filter(e => { if (e.namespaceURI === 'http://www.w3.org/2000/svg') return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.right > iw + 1 && !e.closest('.v9-marquee, .v9-wordmark-marquee'); }).slice(0, 4).map(e => e.tagName.toLowerCase() + '.' + [...e.classList].slice(0, 2).join('.'));
        const clipped = [...document.querySelectorAll('.v9-h1, .v9-h2, .v9-h3, .v9-eyebrow, .v9-tag, .v9-capsule-text strong, .v9-forms strong, .v9-tile-caption strong')].filter(e => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== 'visible').slice(0, 4).map(e => e.textContent.trim().slice(0, 30));
        return { sw: document.documentElement.scrollWidth, iw, wide, clipped };
      })()`);
      ok("v9:widths", `no horizontal overflow at ${width}px`, w.sw <= w.iw + 1 && w.wide.length === 0, JSON.stringify(w));
      ok("v9:widths", `no clipped headings or labels at ${width}px`, w.clipped.length === 0, w.clipped.join(" | "));
      if (width === 320 || width === 390) {
        const taps = await evaluate<number>(cdp, `[...document.querySelectorAll('.v9-home a, .v9-home button')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.height < 40 || r.width < 40); }).length`);
        ok("v9:widths", `tap targets at ${width}px are at least 40px`, taps === 0, `${taps} small targets`);
      }
    }

    section("homepage v9 — without scripting, reduced motion, claims");
    const html = await (await fetch(`${BASE}/`)).text();
    ok("v9:nojs", "the six station scenes are in the server HTML", (html.match(/v5-station-scene/g) || []).length >= 6);
    ok("v9:nojs", "the bench's Expected readout is in the server HTML", /v5-readout-verdict">Expected</.test(html));
    ok("v9:nojs", "the ticker's items are in the server HTML as a list", (html.match(/v9-chip/g) || []).length >= 10);
    await setViewport(cdp, 1440, 900);
    await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    await open(cdp, `${BASE}/`, 1200);
    const rm = await evaluate<{ running: number; hidden: number }>(cdp, `(() => {
      const els = [...document.querySelectorAll('.v9-home *')];
      return { running: els.filter(e => { const a = getComputedStyle(e).animationName; return a && a !== 'none'; }).length, hidden: els.filter(e => e.matches('h1, h2, .v5-art, .v9-tile') && parseFloat(getComputedStyle(e).opacity) < 0.99).length };
    })()`);
    ok("v9:motion", "reduced motion runs no animation and hides nothing", rm.running === 0 && rm.hidden === 0, JSON.stringify(rm));
    await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
    const text = await evaluate<string>(cdp, `document.body.innerText`);
    ok("v9:claims", "no exact pricing", !/£\s?\d|\$\s?\d|starting from|per month|\/month/i.test(text));
    ok("v9:claims", "no promised outcomes", !/guarantee[ds]? (leads|calls|revenue|results)|go viral|10x/i.test(text));
    ok("v9:claims", "illustrative material is labelled", (text.match(/illustrative/gi) || []).length >= 2);
    ok("v9:claims", "AI is not the public category", !/\bAI\b|artificial intelligence/.test(text));
  } finally {
    close();
  }
  const r = summary();
  console.log(`\nmarketing-v9: pass=${r.pass} partial=${r.partial} fail=${r.fail} na=${r.na}`);
  process.exit(r.fail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
