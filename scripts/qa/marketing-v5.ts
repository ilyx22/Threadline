/**
 * MARKETING v5 — the interactions on the public homepage, exercised in a real
 * browser against the running site (QA_BASE, default :3000).
 *
 *   node scripts/qa/run.cjs marketing-v5
 *
 * Covers: the scenes are present and readable without waiting for any reveal;
 * the workshop stage moves station by button, key and scroll and pans on a
 * phone; the bench walks its five states, applies the change and retests;
 * the expressions show their sentence on hover, press and focus; the
 * navigation drawer opens and closes; reduced motion leaves no animation
 * running and every scene visible; no horizontal overflow at 320/390/768/1024/1440.
 */
import path from "node:path";
import { record, section, summary } from "./context";
import { evaluate, launchChrome, open, setViewport, sleep } from "./cdp";

const BASE = (process.env.QA_BASE ?? "http://localhost:3000").replace(/\/$/, "");
const OUT = path.resolve("scripts/qa/.shots/marketing-v5");

const q = (sel: string) => `document.querySelector(${JSON.stringify(sel)})`;
const click = (sel: string) => `${q(sel)}.click(); true`;
const attr = (sel: string, name: string) => `${q(sel)}?.getAttribute(${JSON.stringify(name)})`;
/** Wait until the page has hydrated (the Motion component marks the document). */
async function hydrated(cdp: Parameters<typeof evaluate>[0], ms = 10000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (await evaluate<boolean>(cdp, `document.documentElement.dataset.js === '1'`)) return true;
    await sleep(150);
  }
  return false;
}

async function main() {
  const { cdp, close } = await launchChrome({ profileDir: path.join(OUT, ".chrome-profile") });
  try {
    const ok = (area: string, feature: string, cond: boolean, detail = "") => record(area, feature, cond ? "PASS" : "FAIL", detail, cond ? undefined : "MARKETING-V5");

    section("marketing v5 — scenes are complete before any reveal");
    await setViewport(cdp, 1440, 900);
    await open(cdp, `${BASE}/`, 1500);
    await hydrated(cdp);
    const scenes = await evaluate<number>(cdp, `document.querySelectorAll('section[data-scene]').length`);
    ok("v5:scenes", "thirteen scenes present", scenes === 13, `${scenes}`);
    const hidden = await evaluate<number>(cdp, `[...document.querySelectorAll('section[data-scene] svg, section[data-scene] h2, .v5-tagline')].filter(e => parseFloat(getComputedStyle(e).opacity) < 0.99).length`);
    ok("v5:scenes", "nothing starts hidden", hidden === 0, `${hidden} elements below opacity 1 before scrolling`);
    const arts = await evaluate<number>(cdp, `document.querySelectorAll('svg[role=img][aria-label]').length`);
    ok("v5:scenes", "every scene illustration carries a description", arts >= 12, `${arts} labelled illustrations`);
    const h1 = await evaluate<string>(cdp, `document.querySelector('h1')?.textContent`);
    ok("v5:scenes", "hero headline is the approved line", /visible before the sales call/.test(h1 ?? ""), h1 ?? "");

    section("marketing v5 — the workshop stage");
    await evaluate(cdp, `${q("#workshop")}.scrollIntoView({block:'start', behavior:'instant'}); true`);
    await sleep(700);
    ok("v5:workshop", "starts at station 1", (await evaluate<string>(cdp, attr(".v5-stage", "data-station"))) === "0");
    await evaluate(cdp, click(".v5-stage-dots li:nth-child(4) .v5-dot"));
    await sleep(600);
    ok("v5:workshop", "dot moves the carrier to station 4", (await evaluate<string>(cdp, attr(".v5-stage", "data-station"))) === "3");
    ok("v5:workshop", "caption follows", /distribution/i.test(await evaluate<string>(cdp, `${q(".v5-stage-caption h3")}.textContent`)));
    await evaluate(cdp, `${q(".v5-stage-art")}.focus(); ${q(".v5-stage-art")}.dispatchEvent(new KeyboardEvent('keydown', {key:'ArrowRight', bubbles:true})); true`);
    await sleep(500);
    ok("v5:workshop", "arrow key advances", (await evaluate<string>(cdp, attr(".v5-stage", "data-station"))) === "4");
    await evaluate(cdp, `${q(".v5-stage-track li[data-i='1']")}.scrollIntoView({block:'center', behavior:'instant'}); true`);
    await sleep(900);
    ok("v5:workshop", "scrolling the track sets the station", (await evaluate<string>(cdp, attr(".v5-stage", "data-station"))) === "1");
    const carrierStates = await evaluate<number>(cdp, `document.querySelectorAll('.v5-carrier > g > g').length`);
    ok("v5:workshop", "carrier shows one object state", carrierStates === 1, `${carrierStates}`);

    section("marketing v5 — the testing bench");
    await evaluate(cdp, `${q("#diagnosis")}.scrollIntoView({block:'start', behavior:'instant'}); true`);
    await sleep(500);
    ok("v5:bench", "starts at Expected", (await evaluate<string>(cdp, attr(".v5-bench", "data-state"))) === "0");
    await evaluate(cdp, click("#bench-tab-2"));
    await sleep(400);
    ok("v5:bench", "Why tips the failed block", (await evaluate<number>(cdp, `document.querySelectorAll('.v5-block.is-failed').length`)) === 1);
    ok("v5:bench", "Why readout names the failure", /hook failed/i.test(await evaluate<string>(cdp, `${q(".v5-readout-verdict")}.textContent`)));
    await evaluate(cdp, click("#bench-tab-3"));
    await sleep(300);
    ok("v5:bench", "Change shows the lever", (await evaluate<number>(cdp, `document.querySelectorAll('#bench-lever').length`)) === 1);
    await evaluate(cdp, `const l=${q("#bench-lever")}; const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; s.call(l,'80'); l.dispatchEvent(new Event('input',{bubbles:true})); true`);
    await sleep(500);
    ok("v5:bench", "pulling the lever swaps the part", (await evaluate<string>(cdp, attr(".v5-bench", "data-applied"))) === "true" && (await evaluate<number>(cdp, `document.querySelectorAll('.v5-block.is-new').length`)) === 1);
    await evaluate(cdp, click("#bench-tab-4"));
    await sleep(900);
    const retestFill = await evaluate<number>(cdp, `document.querySelectorAll('.v5-block.is-failed').length`);
    ok("v5:bench", "Retest shows the recovered piece", retestFill === 0 && /recovers|buyers|moves/i.test(await evaluate<string>(cdp, `${q(".v5-readout-verdict")}.textContent`)));
    await evaluate(cdp, click(".v5-cases .v5-chip:nth-child(2)"));
    await sleep(300);
    ok("v5:bench", "switching case resets to Expected", (await evaluate<string>(cdp, attr(".v5-bench", "data-state"))) === "0" && /reach/i.test(await evaluate<string>(cdp, `${q(".v5-piece text")}.textContent`)));
    await evaluate(cdp, `${q("#bench-tab-0")}.focus(); ${q(".v5-tabs")}.dispatchEvent(new KeyboardEvent('keydown', {key:'ArrowRight', bubbles:true})); true`);
    await sleep(300);
    ok("v5:bench", "arrow keys move between states", (await evaluate<string>(cdp, attr("#bench-tab-1", "aria-selected"))) === "true");
    await evaluate(cdp, click(".v5-bench-actions .v5-btn:last-child"));
    await sleep(7200);
    ok("v5:bench", "Run the loop walks to Retest", (await evaluate<string>(cdp, attr(".v5-bench", "data-state"))) === "4");
    const illustrative = await evaluate<boolean>(cdp, `/illustrative/i.test(${q("#diagnosis")}.innerText)`);
    ok("v5:bench", "labelled illustrative on the page", illustrative);

    section("marketing v5 — expressions");
    await evaluate(cdp, `${q("#expressions")}.scrollIntoView({block:'start', behavior:'instant'}); true`);
    await sleep(400);
    await evaluate(cdp, `const b=${q(".v5-expr-btn")}; b.focus(); b.dispatchEvent(new FocusEvent("focusin", {bubbles:true})); true`);
    await sleep(300);
    ok("v5:expressions", "focus shows the sentence", /easy to encounter/i.test(await evaluate<string>(cdp, `${q(".v5-expr-why")}.textContent`)));
    ok("v5:expressions", "the artefact lifts", (await evaluate<number>(cdp, `document.querySelectorAll('.v5-expr.is-on').length`)) === 1);
    await evaluate(cdp, `const b=${q(".v5-expr-btn")}; b.dispatchEvent(new FocusEvent("focusout", {bubbles:true})); b.blur(); true`);
    await evaluate(cdp, click(".v5-expr-list li:nth-child(2) .v5-expr-btn"));
    await sleep(300);
    ok("v5:expressions", "a press pins the sentence", /judgement behind it/i.test(await evaluate<string>(cdp, `${q(".v5-expr-why")}.textContent`)));

    section("marketing v5 — navigation and widths");
    for (const w of [1440, 1024, 768, 390, 320]) {
      await setViewport(cdp, w, 900);
      await open(cdp, `${BASE}/`, 900);
      const o = await evaluate<{ sw: number; iw: number; wide: string[] }>(cdp, `(() => { const vis = e => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; }; const clipped = e => { for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o !== 'visible') return true; } return false; }; const wide = [...document.querySelectorAll('body *')].filter(e => vis(e) && e.getBoundingClientRect().right > innerWidth + 2 && !clipped(e)).slice(0,3).map(e => e.tagName + '.' + [...e.classList].join('.')); return { sw: document.documentElement.scrollWidth, iw: innerWidth, wide }; })()`);
      ok("v5:widths", `no horizontal overflow at ${w}`, o.sw <= o.iw + 1 && o.wide.length === 0, `scrollW=${o.sw} inner=${o.iw} ${o.wide.join(",")}`);
      const tiny = await evaluate<string[]>(cdp, `[...document.querySelectorAll('a[href],button,input[type=range]')].filter(x => { const b = x.getBoundingClientRect(); return b.width > 0 && b.height > 0 && (b.width < 44 || b.height < 44); }).slice(0,5).map(x => (x.textContent.trim() || x.getAttribute('aria-label') || x.tagName).slice(0,20) + ':' + Math.round(x.getBoundingClientRect().width) + 'x' + Math.round(x.getBoundingClientRect().height))`);
      if (w <= 390) ok("v5:widths", `tap targets ≥ 44px at ${w}`, tiny.length === 0, tiny.join(", "));
    }
    await setViewport(cdp, 390, 844);
    await open(cdp, `${BASE}/`, 1200);
    ok("v5:nav", "page hydrates on a phone", await hydrated(cdp));
    await evaluate(cdp, click(".v5-menu"));
    await sleep(400);
    ok("v5:nav", "phone drawer opens", (await evaluate<boolean>(cdp, `!${q("#v5-drawer")}.hidden`)) === true && (await evaluate<number>(cdp, `document.querySelectorAll('.v5-drawer-link').length`)) >= 4);
    await evaluate(cdp, `window.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape'})); true`);
    await sleep(200);
    ok("v5:nav", "Escape closes it", (await evaluate<boolean>(cdp, `${q("#v5-drawer")}.hidden`)) === true);
    await evaluate(cdp, `${q("#workshop")}.scrollIntoView({block:'start', behavior:'instant'}); true`);
    await sleep(400);
    await evaluate(cdp, click(".v5-stage-controls .v5-btn:last-child"));
    await sleep(1200);
    const pan = await evaluate<string>(cdp, `getComputedStyle(${q(".v5-stage-art svg")}).transform`);
    ok("v5:nav", "phone workshop pans the camera", (await evaluate<string>(cdp, attr(".v5-stage", "data-station"))) === "1" && pan !== "none", pan);

    section("marketing v5 — reduced motion");
    await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    await setViewport(cdp, 1440, 900);
    await open(cdp, `${BASE}/`, 1200);
    for (const sel of ["#memory", "#workshop", "#diagnosis", "#closing"]) {
      await evaluate(cdp, `${q(sel)}.scrollIntoView({block:'center', behavior:'instant'}); true`);
      await sleep(400);
    }
    const running = await evaluate<number>(cdp, `[...document.querySelectorAll('*')].filter(e => { const b = e.getBoundingClientRect(); return b.width > 0 && getComputedStyle(e).animationName !== 'none' && getComputedStyle(e).animationPlayState === 'running'; }).length`);
    ok("v5:motion", "nothing animates under reduced motion", running === 0, `${running} running`);
    const invisible = await evaluate<number>(cdp, `[...document.querySelectorAll('section[data-scene] svg')].filter(e => parseFloat(getComputedStyle(e).opacity) < 0.99).length`);
    ok("v5:motion", "every scene visible in its final state", invisible === 0, `${invisible} hidden`);
    await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "" }] });

    section("marketing v5 — copy rules");
    await open(cdp, `${BASE}/`, 800);
    const text = await evaluate<string>(cdp, `document.body.innerText`);
    ok("v5:copy", "no exact pricing", !/£\s?\d|\$\s?\d|starting from|per month|\/month/i.test(text));
    ok("v5:copy", "no platform-first category", !/linkedin (agency|ghostwrit)|content agency|content-growth|content growth/i.test(text));
    ok("v5:copy", "no promised outcomes", !/guarantee[ds]? (leads|calls|revenue|results)|go viral|10x/i.test(text));
    ok("v5:copy", "illustrative content labelled", /illustrative/i.test(text));
    const design = await evaluate<number>(cdp, `fetch('/design-lab').then(r => r.status)`);
    record("v5:copy", "design lab is not served in production builds", design === 404 ? "PASS" : process.env.NODE_ENV === "production" ? "FAIL" : "NA", `status ${design} (dev servers do serve it)`);
  } finally {
    close();
  }
  const s = summary();
  console.log(`\nmarketing-v5: pass=${s.pass} partial=${s.partial} fail=${s.fail} na=${s.na}`);
  process.exit(s.fail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
