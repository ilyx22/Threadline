/**
 * Launch-readiness audit (25 September 2026): every public route at five
 * widths. Console errors, failed requests, overflow, clipped headings,
 * essential content left at low opacity, duplicate ids, heading order,
 * broken or alt-less images, unnamed controls, keyboard focus visibility,
 * the mobile drawer, anchors under the sticky nav, the apply form's empty
 * submit, reduced motion and no-JS. Prints one line per finding.
 *   QA_BASE=http://localhost:3001 node scripts/qa/run.cjs launch-audit
 */
import { launchChrome, evaluate, open, scrollThrough, setViewport, sleep } from "./cdp";

const BASE = process.env.QA_BASE ?? "http://localhost:3001";
const CHAPTERS = ["expertise-is-the-raw-material", "positioning-is-a-decision", "listen-before-you-speak", "one-thesis-many-expressions", "distribution-is-a-place-not-a-blast", "repeated-exposure-builds-memory", "measure-what-the-buyer-did", "write-down-what-you-expect", "change-one-thing-and-retest", "what-we-do-not-promise"];
const ROUTES = ["/", "/how-it-works", "/who-its-for", "/playbook", ...CHAPTERS.map((c) => `/playbook/${c}`), "/calculator", "/apply", "/login", "/forgot-password", "/reset-password"];
const WIDTHS = [1440, 1024, 768, 390, 320];

const AUDIT = `(() => {
  const iw = document.documentElement.clientWidth, sw = document.documentElement.scrollWidth;
  const inScroller = (e) => !!e.closest('.v9-marquee, .v9-wordmark-marquee, .v9-frieze, .hw-stage-scroll, .v5-marquee, [data-scroll], .overflow-x-auto');
  const wide = [...document.querySelectorAll('body *')].filter(e => { if (e.namespaceURI === 'http://www.w3.org/2000/svg') return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.right > iw + 2 && !inScroller(e); }).slice(0, 5).map(e => e.tagName.toLowerCase() + '.' + [...e.classList].slice(0, 2).join('.'));
  const clipped = [...document.querySelectorAll('h1,h2,h3,.v9-tag,.v9-eyebrow,strong,button,a')].filter(e => e.scrollWidth > e.clientWidth + 2 && ['hidden','clip'].includes(getComputedStyle(e).overflowX) && e.getBoundingClientRect().width > 0 && !inScroller(e)).slice(0, 5).map(e => (e.textContent || '').trim().slice(0, 30));
  const low = [...document.querySelectorAll('h1,h2,h3,p,li,.v9-btn,.v5-btn,.tl-btn,label,input,summary')].filter(e => { const r = e.getBoundingClientRect(); if (r.width === 0 || r.height === 0) return false; let n = e; while (n && n !== document.body) { if (parseFloat(getComputedStyle(n).opacity) < 0.9) return true; n = n.parentElement; } return false; }).slice(0, 5).map(e => e.tagName.toLowerCase() + ':' + (e.textContent || '').trim().slice(0, 30));
  const ids = [...document.querySelectorAll('[id]')].map(e => e.id); const dup = [...new Set(ids.filter((x, i) => ids.indexOf(x) !== i))].slice(0, 5);
  const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => Number(h.tagName[1])); const h1 = hs.filter(x => x === 1).length; let jumps = 0; for (let i = 1; i < hs.length; i++) if (hs[i] > hs[i-1] + 1) jumps++;
  const imgs = [...document.images]; const broken = imgs.filter(i => i.complete && i.naturalWidth === 0 && i.getBoundingClientRect().width > 0).map(i => (i.currentSrc || i.src).slice(-40)).slice(0, 5); const noAlt = imgs.filter(i => !i.hasAttribute('alt')).length;
  const stretched = imgs.filter(i => { const r = i.getBoundingClientRect(); if (!i.naturalWidth || r.width === 0) return false; const a = i.naturalWidth / i.naturalHeight, b = r.width / r.height; return getComputedStyle(i).objectFit === 'fill' && Math.abs(a - b) / a > 0.08; }).map(i => (i.currentSrc || i.src).slice(-40)).slice(0, 5);
  const unnamed = [...document.querySelectorAll('button, a[href], input:not([type=hidden]), select, textarea')].filter(e => { const r = e.getBoundingClientRect(); if (r.width === 0) return false; const name = (e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || e.getAttribute('title') || (e.id && document.querySelector('label[for="' + e.id + '"]')?.textContent) || e.closest('label')?.textContent || e.textContent || e.getAttribute('placeholder') || '').trim(); return !name; }).slice(0, 5).map(e => e.tagName.toLowerCase() + '.' + [...e.classList].slice(0, 2).join('.'));
  const small = [...document.querySelectorAll('button, a[href]')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.height < 32 || r.width < 32) && !e.closest('footer, nav, .v9-ticker'); }).length;
  const dev = /lorem|TODO|FIXME|placeholder text|coming soon|\\[insert/i.test(document.body.innerText) ;
  return { iw, sw, wide, clipped, low, dup, h1, jumps, broken, noAlt, stretched, unnamed, small, dev, height: document.documentElement.scrollHeight };
})()`;

async function main() {
  const b = await launchChrome({ profileDir: ".chrome-profile-audit" });
  const { cdp } = b;
  const findings: string[] = [];
  const note = (s: string) => { findings.push(s); console.log("  " + s); };
  await cdp.send("Runtime.enable"); await cdp.send("Log.enable"); await cdp.send("Network.enable"); await cdp.send("Page.enable");
  let consoleErrors: string[] = []; let netFails: string[] = [];
  cdp.on("Runtime.exceptionThrown", (p) => consoleErrors.push("exception: " + String((p as { exceptionDetails?: { text?: string; exception?: { description?: string } } }).exceptionDetails?.exception?.description ?? (p as { exceptionDetails?: { text?: string } }).exceptionDetails?.text).slice(0, 160)));
  cdp.on("Runtime.consoleAPICalled", (p) => { const q = p as { type: string; args: { value?: unknown; description?: string }[] }; if (q.type === "error" || q.type === "warning") consoleErrors.push(q.type + ": " + q.args.map((a) => String(a.value ?? a.description ?? "")).join(" ").slice(0, 160)); });
  cdp.on("Log.entryAdded", (p) => { const e = (p as { entry: { level: string; text: string; url?: string } }).entry; if (e.level === "error") consoleErrors.push("log: " + e.text.slice(0, 120) + " " + (e.url || "").slice(-50)); });
  cdp.on("Network.loadingFailed", (p) => netFails.push("failed: " + String((p as { errorText?: string }).errorText) + " " + String((p as { requestId?: string }).requestId)));
  cdp.on("Network.responseReceived", (p) => { const r = (p as { response: { status: number; url: string } }).response; if (r.status >= 400) netFails.push(`${r.status} ${r.url.slice(-70)}`); });

  const hrefs = new Set<string>();
  for (const width of WIDTHS) {
    await setViewport(cdp, width, 900);
    for (const route of ROUTES) {
      consoleErrors = []; netFails = [];
      await open(cdp, `${BASE}${route}`, 1500);
      await scrollThrough(cdp, 300);
      await sleep(500);
      const a = await evaluate<{ iw: number; sw: number; wide: string[]; clipped: string[]; low: string[]; dup: string[]; h1: number; jumps: number; broken: string[]; noAlt: number; stretched: string[]; unnamed: string[]; small: number; dev: boolean; height: number }>(cdp, AUDIT);
      const tag = `${route}@${width}`;
      if (a.sw > a.iw + 1) note(`${tag} horizontal overflow sw=${a.sw} iw=${a.iw}`);
      if (a.wide.length) note(`${tag} elements past the viewport: ${a.wide.join(", ")}`);
      if (a.clipped.length) note(`${tag} clipped text: ${a.clipped.join(" | ")}`);
      if (a.low.length) note(`${tag} low-opacity content after scroll: ${a.low.join(" | ")}`);
      if (a.dup.length) note(`${tag} duplicate ids: ${a.dup.join(", ")}`);
      if (a.h1 !== 1) note(`${tag} h1 count ${a.h1}`);
      if (a.jumps) note(`${tag} heading level jumps ${a.jumps}`);
      if (a.broken.length) note(`${tag} broken images: ${a.broken.join(", ")}`);
      if (a.noAlt) note(`${tag} images without alt: ${a.noAlt}`);
      if (a.stretched.length) note(`${tag} stretched images: ${a.stretched.join(", ")}`);
      if (a.unnamed.length) note(`${tag} unnamed controls: ${a.unnamed.join(", ")}`);
      if (a.dev) note(`${tag} development text present`);
      if (width === 1440 && a.small) console.log(`  (${tag} ${a.small} controls under 32px, mostly inline links)`);
      if (consoleErrors.length) note(`${tag} console: ${[...new Set(consoleErrors)].slice(0, 3).join(" || ")}`);
      if (netFails.length) note(`${tag} network: ${[...new Set(netFails)].slice(0, 3).join(" || ")}`);
      if (width === 1440) { const links = await evaluate<string[]>(cdp, `[...document.querySelectorAll('a[href^="/"], a[href^="#"]')].map(a => a.getAttribute('href'))`); links.forEach((h) => hrefs.add(route + " -> " + h)); }
      console.log(`${tag} ok height=${a.height}`);
    }
  }

  console.log("\nKEYBOARD, DRAWER, ANCHORS, FORM, REDUCED MOTION, NO-JS");
  await setViewport(cdp, 1440, 900);
  await open(cdp, `${BASE}/`, 1500);
  const focus: string[] = [];
  for (let i = 0; i < 6; i++) {
    await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    await sleep(80);
    focus.push(await evaluate<string>(cdp, `(() => { const e = document.activeElement; const cs = getComputedStyle(e); return e.tagName.toLowerCase() + '.' + [...e.classList].slice(0,1).join('') + ' outline=' + cs.outlineStyle + '/' + cs.outlineWidth + ' fv=' + e.matches(':focus-visible'); })()`));
  }
  console.log("  tab order: " + focus.join(" > "));
  if (focus.some((f) => /outline=none|outline=.*\/0px/.test(f) && /fv=true/.test(f))) note("keyboard focus without a visible outline: " + focus.filter((f) => /outline=none|\/0px/.test(f)).join(", "));

  await setViewport(cdp, 390, 800);
  await open(cdp, `${BASE}/`, 1500);
  const drawer = await evaluate<string>(cdp, `(async () => { const b = document.querySelector('.v5-menu'); const d = document.getElementById('v5-drawer'); const s = []; s.push('closed=' + d.hidden); b.click(); await new Promise(r => setTimeout(r, 200)); s.push('open=' + !d.hidden + ' expanded=' + b.getAttribute('aria-expanded')); const links = [...d.querySelectorAll('a')].map(a => a.getAttribute('href')); s.push('links=' + links.length); const off = [...d.querySelectorAll('a')].filter(a => a.getBoundingClientRect().right > innerWidth + 1).length; s.push('linksPastViewport=' + off); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await new Promise(r => setTimeout(r, 200)); s.push('afterEscape hidden=' + d.hidden); b.click(); await new Promise(r => setTimeout(r, 200)); b.click(); await new Promise(r => setTimeout(r, 200)); s.push('toggleClosed=' + d.hidden); return s.join(' '); })()`);
  console.log("  drawer: " + drawer);
  if (!/open=true/.test(drawer) || !/afterEscape hidden=true/.test(drawer) || !/toggleClosed=true/.test(drawer)) note("mobile drawer misbehaves: " + drawer);

  for (const width of [1440, 390]) {
    await setViewport(cdp, width, 900);
    await open(cdp, `${BASE}/playbook#chapter-3`, 1800);
    const anchor = await evaluate<string>(cdp, `(() => { const h = document.querySelector('#chapter-3 h2'); const r = h.getBoundingClientRect(); const nav = document.querySelector('.v5-nav'); const rail = document.querySelector('.pb-rail'); const navB = nav ? nav.getBoundingClientRect().bottom : 0; const railB = rail ? rail.getBoundingClientRect().bottom : 0; return JSON.stringify({ headingTop: Math.round(r.top), navBottom: Math.round(navB), railBottom: Math.round(railB), navPos: nav && getComputedStyle(nav).position, railPos: rail && getComputedStyle(rail).position }); })()`);
    console.log(`  anchor #chapter-3 @${width}: ${anchor}`);
    const j = JSON.parse(anchor) as { headingTop: number; navBottom: number; railBottom: number };
    if (j.headingTop < Math.max(j.navBottom, j.railBottom) - 2) note(`anchor target hidden under sticky nav/rail @${width}: ${anchor}`);
  }

  await setViewport(cdp, 1440, 900);
  await open(cdp, `${BASE}/apply`, 1500);
  const form = await evaluate<string>(cdp, `(async () => { const f = document.querySelector('form'); if (!f) return 'no form'; const btn = [...f.querySelectorAll('button')].find(b => /continue|next|submit|apply|send/i.test(b.textContent || '')); const before = location.pathname; btn.click(); await new Promise(r => setTimeout(r, 900)); const errs = f.querySelectorAll('[aria-invalid="true"], [role="alert"], .text-danger, [data-error], p[id$="-error"]').length; const alertText = [...f.querySelectorAll('[role="alert"], [aria-live]')].map(e => e.textContent.trim()).filter(Boolean).slice(0, 2).join(' | '); const disabled = [...f.querySelectorAll('button')].filter(b => b.disabled).map(b => b.textContent.trim()); return JSON.stringify({ button: btn && btn.textContent.trim(), errs, alertText: alertText.slice(0, 120), disabled, samePage: location.pathname === before, invalidFirst: document.activeElement && document.activeElement.getAttribute && document.activeElement.getAttribute('aria-invalid') }); })()`);
  console.log("  apply empty submit: " + form);
  if (!/"errs":[1-9]/.test(form)) note("apply form: empty submit shows no field errors: " + form);

  await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  for (const route of ["/", "/how-it-works", "/playbook"]) {
    await open(cdp, `${BASE}${route}`, 1500);
    const rm = await evaluate<string>(cdp, `(() => { const els = [...document.querySelectorAll('h1,h2,h3,p,.v9-btn,.v9-tile,img')]; const hidden = els.filter(e => { const r = e.getBoundingClientRect(); if (!r.width) return false; let n = e; while (n && n !== document.body) { if (parseFloat(getComputedStyle(n).opacity) < 0.9) return true; n = n.parentElement; } return false; }).length; const running = [...document.querySelectorAll('*')].filter(e => { const a = getComputedStyle(e).animationName; return a && a !== 'none' && getComputedStyle(e).animationPlayState === 'running'; }).length; return JSON.stringify({ hidden, running }); })()`);
    console.log(`  reduced motion ${route}: ${rm}`);
    if (!/"hidden":0/.test(rm)) note(`reduced motion leaves content hidden on ${route}: ${rm}`);
  }
  await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
  await cdp.send("Emulation.setScriptExecutionDisabled", { value: true });
  for (const route of ["/", "/playbook", "/apply"]) {
    await open(cdp, `${BASE}${route}`, 1200);
    const nojs = await evaluate<string>(cdp, `(() => { const els = [...document.querySelectorAll('h1,h2,p,.v9-btn')]; const hidden = els.filter(e => { const r = e.getBoundingClientRect(); if (!r.width) return false; let n = e; while (n && n !== document.body) { if (parseFloat(getComputedStyle(n).opacity) < 0.9) return true; n = n.parentElement; } return false; }).length; return JSON.stringify({ hidden, h1: document.querySelectorAll('h1').length, buttons: document.querySelectorAll('.v9-btn, .tl-btn, button').length }); })()`).catch(() => "evaluate blocked");
    console.log(`  no-js ${route}: ${nojs}`);
  }
  await cdp.send("Emulation.setScriptExecutionDisabled", { value: false });

  console.log("\nLINK TARGETS (unique)");
  const targets = [...new Set([...hrefs].map((h) => h.split(" -> ")[1]))].filter((h) => h.startsWith("/"));
  for (const t of targets) {
    const res = await fetch(`${BASE}${t.split("#")[0]}`, { method: "GET", redirect: "manual" });
    if (res.status >= 400) note(`link target ${t} -> ${res.status}`);
  }
  console.log(`  ${targets.length} internal targets checked`);
  console.log(`\nFINDINGS: ${findings.length}`);
  b.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
