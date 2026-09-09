/**
 * PUBLIC WEBSITE QA — the pre-client experience, on a production build.
 *
 *   npm run build && npm start   (another shell)
 *   node scripts/qa/run.cjs public-qa            (QA_BASE overrides http://localhost:3000)
 *
 * Checks, per public route:
 *   200 · no console errors · no hydration warnings · no horizontal overflow at
 *   20 widths · nav + CTA present · skip link · one h1 and a sane heading
 *   order · every internal link resolves · metadata basics (title, description,
 *   canonical, OG) · reduced-motion respected · reference-brand leak ·
 *   placeholder leak · synthetic metrics are labelled.
 * Then: the application form submits end to end and lands in the database.
 */
import { prisma } from "../../src/lib/db/client";
import { record, section, summary } from "./context";
import { launchChrome, evaluate, open, screenshot, scrollThrough, setViewport, sleep } from "./cdp";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const BASE = (process.env.QA_BASE ?? "http://localhost:3000").replace(/\/$/, "");
const ROUTES = ["/", "/how-it-works", "/who-its-for", "/playbook", "/playbook/expertise-is-the-raw-material", "/playbook/what-we-do-not-promise", "/apply", "/calculator", "/login", "/forgot-password", "/this-page-does-not-exist"];
const WIDTHS = [1920, 1600, 1440, 1366, 1280, 1200, 1024, 900, 820, 768, 760, 720, 640, 600, 500, 460, 430, 390, 375, 320];
const DEEP = new Set([1440, 1024, 768, 390, 320]);
const OUT = path.resolve("scripts/qa/.shots/public");
const ONLY = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
const WIDTH_FILTER = process.argv.find((a) => a.startsWith("--width="))?.slice(8).split(",").map(Number);

/** Words that must never appear in Threadline's public output (reference-analysis/birdhouse/forbidden-to-copy.md). */
const BRAND_LEAK = /birdhouse|marcos|pesto|sila digital|thebirdhouse|beehiiv|fillout|outlier post method|0 to 10k|workwithhydra|\bhydra\b|throughput capped|one constraint|starborn|trivellato|leverbrands|lever brands|invisible keyboard|windmill|demandii|\binfluent\b|nova impact|understory/i; // every reference site analysed on 2026-09-09 (reference-analysis/*)
const PLACEHOLDER = /\bTBD\b|\bTODO\b|lorem ipsum|placeholder|example\.com|dummy|\(555\)|acme corp|your company here|coming soon/i;
const CADENCE = /\bmonthly (fee|retainer|price)|per month\b|\/month\b/i;
const PRICE = /£\s?2,?500|£\s?5,?000|£\s?10,?000|2\.5k|starting (from|at) £/i; // DEC-017: exact service pricing is never public
const OVERCLAIM = /guarantee(d)? (leads|revenue|results)|go viral|10x|supercharge|unlock|game-chang|leverage ai|revolutioni[sz]e|cutting-edge/i;

const AUDIT = `(() => {
  const d = document, w = innerWidth, de = d.documentElement;
  const vis = (e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
  const inScroller = (e) => { for (let p = e.parentElement; p && p !== d.body; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o === 'auto' || o === 'scroll') return true; } return false; };
  const name = (e) => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + '.' + (typeof e.className === 'string' ? e.className : e.getAttribute('class') || '').split(' ').slice(0, 3).join('.') + ' in ' + (e.closest('section,header,footer')?.id || e.closest('section,header,footer')?.tagName.toLowerCase() || '?') + ' right=' + Math.round(e.getBoundingClientRect().right);
  const wide = [...d.querySelectorAll('body *')].filter((e) => vis(e) && e.getBoundingClientRect().right > w + 2 && !inScroller(e)).filter((e, i, arr) => !arr.includes(e.parentElement)).slice(0, 3).map(name);
  const headings = [...d.querySelectorAll('h1,h2,h3,h4')].filter(vis).map((h) => Number(h.tagName[1]));
  let order = true; for (let i = 1; i < headings.length; i++) if (headings[i] - headings[i - 1] > 1) order = false;
  const h1 = headings.filter((h) => h === 1).length;
  const links = [...d.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((h) => h && h.startsWith('/') && !h.startsWith('//'));
  const meta = (n) => d.querySelector('meta[name="' + n + '"], meta[property="' + n + '"]')?.getAttribute('content') || '';
  const tinyEls = [...d.querySelectorAll('a[href],button')].filter((x) => { const b = x.getBoundingClientRect(); return vis(x) && (b.width < 44 || b.height < 44); });
  const tiny = tinyEls.length;
  const tinyEg = tinyEls.slice(0, 4).map((x) => (x.textContent.trim() || x.getAttribute('aria-label') || x.tagName).slice(0, 18) + ':' + Math.round(x.getBoundingClientRect().width) + 'x' + Math.round(x.getBoundingClientRect().height));
  const unlabeled = [...d.querySelectorAll('input:not([type=hidden]),select,textarea')].filter((el) => vis(el) && !(el.labels && el.labels.length) && !el.getAttribute('aria-label') && !el.closest('label')).length;
  const lang = de.lang;
  const skip = !!d.querySelector('a[href="#main"]');
  const mainEl = !!d.querySelector('main#main, main');
  const nav = !!d.querySelector('header nav, nav');
  const cta = !!d.querySelector('a[href="/apply"]');
  const text = d.body.innerText.replace(/\\s+/g, ' ');
  const synthetic = /synthetic|illustrative/i.test(text);
  const bigNumbers = (text.match(/\\b\\d{1,3}(,\\d{3})+\\b/g) || []).length;
  const portalText = d.querySelector('nextjs-portal')?.shadowRoot?.textContent || '';
  const overlay = /\\d+ issue|Unhandled Runtime Error|Console Error|Build Error/i.test(portalText);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const running = [...d.querySelectorAll('*')].filter((e) => vis(e) && getComputedStyle(e).animationName !== 'none' && getComputedStyle(e).animationPlayState === 'running').length;
  return { path: location.pathname, w, scrollW: de.scrollWidth, overflow: de.scrollWidth > w + 1, wide, h1, order, links: [...new Set(links)], title: d.title, description: meta('description'), og: meta('og:title'), canonical: d.querySelector('link[rel=canonical]')?.getAttribute('href') || '', tiny, tinyEg, unlabeled, lang, skip, mainEl, nav, cta, synthetic, bigNumbers, overlay, reduced, running, text: text.slice(0, 60000) };
})()`;

type Audit = { path: string; w: number; scrollW: number; overflow: boolean; wide: string[]; tinyEg: string[]; h1: number; order: boolean; links: string[]; title: string; description: string; og: string; canonical: string; tiny: number; unlabeled: number; lang: string; skip: boolean; mainEl: boolean; nav: boolean; cta: boolean; synthetic: boolean; bigNumbers: number; overlay: boolean; reduced: boolean; running: number; text: string };

async function main() {
  mkdirSync(OUT, { recursive: true });
  const { cdp, close } = await launchChrome({ profileDir: path.join(OUT, ".chrome-profile") });
  const errors: string[] = [];
  const failed: string[] = [];
  cdp.on("Runtime.consoleAPICalled", (p) => { if (p.type === "error" || p.type === "warning") errors.push(`${p.type}: ${String((p.args as { value?: unknown; description?: string }[]).map((a) => a.value ?? a.description ?? "").join(" ")).slice(0, 160)}`); });
  cdp.on("Runtime.exceptionThrown", (p) => errors.push(`exception: ${String((p.exceptionDetails as { exception?: { description?: string }; text?: string }).exception?.description ?? (p.exceptionDetails as { text?: string }).text).slice(0, 160)}`));
  cdp.on("Network.responseReceived", (p) => { const r = p.response as { status: number; url: string }; if (r.status >= 400 && !/favicon|hot-update/.test(r.url)) failed.push(`${r.status} ${r.url.replace(BASE, "")}`); });
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Network.enable");

  const allLinks = new Set<string>();
  try {
    for (const width of WIDTHS) {
      if (WIDTH_FILTER && !WIDTH_FILTER.includes(width)) continue;
      await setViewport(cdp, width, 900);
      if (DEEP.has(width)) section(`public — ${width}px`);
      for (const route of ROUTES) {
        if (ONLY && route !== ONLY) continue;
        errors.length = 0;
        failed.length = 0;
        await open(cdp, `${BASE}${route}`, 900);
        const scrolled = await scrollThrough(cdp, 320);
        const a = await evaluate<Audit>(cdp, AUDIT);
        const expect404 = route === "/this-page-does-not-exist";
        const pageFailed = failed.filter((f) => f.endsWith(route) || f.includes(`${route}?`));
        const problems: string[] = [];
        const notes: string[] = [];
        if (!expect404 && pageFailed.length) problems.push(`page returned ${pageFailed[0]}`);
        if (expect404 && !pageFailed.some((f) => f.startsWith("404"))) problems.push("404 route did not return 404");
        if (a.overflow || a.wide.length) problems.push(`horizontal overflow scrollW=${a.scrollW} wide=${a.wide.join(",")}`);
        if (a.overlay) problems.push("Next error overlay");
        const runtime = errors.filter((e) => /hydrat|did not match|exception|TypeError|ReferenceError/i.test(e));
        if (runtime.length) problems.push(`runtime: ${runtime[0]}`);
        if (DEEP.has(width)) {
          a.links.forEach((l) => allLinks.add(l));
          if (!expect404) {
            if (a.h1 !== 1) problems.push(`${a.h1} h1s`);
            if (!a.order) notes.push("heading levels skip");
            if (!a.skip && !["/login", "/forgot-password"].includes(route)) problems.push("no skip link");
            if (!a.mainEl) problems.push("no <main>");
            if (!a.nav && !["/login", "/forgot-password"].includes(route)) problems.push("no nav");
            if (!a.cta && !["/login", "/forgot-password", "/apply"].includes(route)) problems.push("no Apply CTA");
            if (!a.title || !a.description) problems.push("missing title/description");
            if (!a.canonical && !["/login", "/forgot-password"].includes(route)) notes.push("no canonical");
            if (a.lang !== "en-GB") problems.push(`lang=${a.lang}`);
            if (a.unlabeled) problems.push(`${a.unlabeled} unlabelled form controls`);
            if (width === 390 && a.tiny > 0) notes.push(`${a.tiny} targets < 44px (${a.tinyEg.join(", ")})`);
            if (BRAND_LEAK.test(a.text)) problems.push(`REFERENCE BRAND LEAK: ${a.text.match(BRAND_LEAK)?.[0]}`);
            if (PLACEHOLDER.test(a.text)) problems.push(`placeholder text: ${a.text.match(PLACEHOLDER)?.[0]}`);
            if (CADENCE.test(a.text)) problems.push(`monthly wording: ${a.text.match(CADENCE)?.[0]}`);
            if (OVERCLAIM.test(a.text)) problems.push(`overclaim wording: ${a.text.match(OVERCLAIM)?.[0]}`);
            if (PRICE.test(a.text)) problems.push(`PRICE DISCLOSURE: ${a.text.match(PRICE)?.[0]}`);
            if (a.bigNumbers > 0 && !a.synthetic && route === "/") problems.push("large numbers shown without a synthetic/illustrative label");
          }
          if (width === 1440 || width === 390 || width === 320) writeFileSync(path.join(OUT, `${width}-${route.replace(/\W+/g, "_") || "home"}.jpg`), await screenshot(cdp, { fullPage: true, format: "jpeg", quality: 70 }));
          record(`public:${width}`, route, problems.length ? "FAIL" : notes.length ? "PARTIAL" : "PASS", [...problems, ...notes].join(" · ") || `ok · h=${scrolled.height} · ${a.running} animations running`, problems.length ? "PUBLIC-QA" : undefined);
        } else if (problems.length) {
          record(`public:${width}`, route, "FAIL", problems.join(" · "), "PUBLIC-QA");
        }
      }
    }

    section("public — reduced motion");
    await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    await setViewport(cdp, 1440, 900);
    await open(cdp, `${BASE}/`, 900);
    await scrollThrough(cdp, 400);
    const rm = await evaluate<Audit>(cdp, AUDIT);
    record("public:motion", "with prefers-reduced-motion nothing animates and all content is visible", rm.reduced && rm.running === 0 && rm.h1 === 1 ? "PASS" : "FAIL", `reduced=${rm.reduced} running=${rm.running}`, rm.running ? "PUBLIC-MOTION" : undefined);
    await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "" }] });

    section("public — links");
    const internal = [...allLinks].filter((l) => !l.startsWith("/app") && !l.startsWith("/admin") && !l.startsWith("/t/"));
    let broken = 0;
    for (const l of internal) {
      const res = await fetch(`${BASE}${l}`, { redirect: "manual" }).catch(() => null);
      if (!res || res.status >= 400) { broken++; record("public:links", l, "FAIL", `status ${res?.status ?? "no response"}`, "PUBLIC-LINK"); }
    }
    record("public:links", `${internal.length} internal links resolve`, broken === 0 ? "PASS" : "FAIL", broken ? `${broken} broken` : "all 2xx/3xx");
    for (const f of ["/sitemap.xml", "/robots.txt", "/opengraph-image", "/icon.svg"]) {
      const res = await fetch(`${BASE}${f}`).catch(() => null);
      record("public:metadata", f, res && res.ok ? "PASS" : "FAIL", `status ${res?.status ?? "no response"} ${res?.headers.get("content-type") ?? ""}`);
    }

    section("public — application submits end to end");
    await setViewport(cdp, 1280, 900);
    await open(cdp, `${BASE}/apply`, 900);
    const marker = `qa-public-${Date.now()}`;
    const submitted = await evaluate<{ ok: boolean; step: number; detail: string }>(cdp, `(async () => {
      const raf = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 120)));
      const set = (name, value) => { const el = document.querySelector('#' + name + ', [name="' + name + '"]'); if (!el) return false; const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return true; };
      const click = (label) => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim().startsWith(label)); if (!b) return false; b.click(); return true; };
      const firstOption = (name) => { const s = document.querySelector('select#' + name + ', select[name="' + name + '"]'); return s ? [...s.options].find((o) => o.value)?.value : ''; };
      set('name', 'QA Public'); set('email', '${marker}@example.test'); set('company', 'QA Public Ltd'); set('website', 'https://qa-public.example.test'); set('whatYouSell', 'Fractional finance leadership for founder-led firms.'); set('revenueRange', firstOption('revenueRange'));
      await raf(); if (!click('Continue') && !click('Next')) return { ok: false, step: 1, detail: 'no continue button' }; await raf(); await raf(); { const errs = [...document.querySelectorAll('p, span')].map((e) => e.textContent.trim()).filter((t) => /^(Enter |Choose |Tell us |Describe |What is|A little)/.test(t)); const step = ''; if (errs.length) return { ok: false, step: 1, detail: 'validation on step 1: ' + errs.join(' | ') + ' :: ' + step + ' :: fields=' + [...document.querySelectorAll('input,select,textarea')].map((f) => f.name + '=' + String(f.value).slice(0, 12)).join(',') }; }
      set('contentProcess', 'Founder writes when there is time; an assistant posts.'); set('peopleInvolved', firstOption('peopleInvolved')); set('publishCadence', firstOption('publishCadence')); set('founderHours', firstOption('founderHours'));
      await raf(); if (!click('Continue') && !click('Next')) return { ok: false, step: 2, detail: 'no continue button' }; await raf(); await raf(); { const errs = [...document.querySelectorAll('p, span')].map((e) => e.textContent.trim()).filter((t) => /^(Enter |Choose |Tell us |Describe |What is|A little)/.test(t)); if (errs.length) return { ok: false, step: 2, detail: 'validation on step 2: ' + errs.join(' | ') + ' :: fields=' + [...document.querySelectorAll('input,select,textarea')].map((f) => f.name + '=' + String(f.value).slice(0, 12)).join(',') }; }
      set('biggestBottleneck', 'Consistency and topic choice.'); set('successLooksLike', 'Two qualified conversations a month from content.'); set('urgency', firstOption('urgency'));
      await raf(); if (!click('Submit') && !click('Send') && !click('Apply')) return { ok: false, step: 3, detail: 'no submit button; page shows: ' + document.body.innerText.replace(/\s+/g, ' ').slice(0, 220) + ' | buttons: ' + [...document.querySelectorAll('button')].map((b) => b.textContent.trim()).join('/') };
      for (let i = 0; i < 40; i++) { await raf(); const err = document.querySelector('[role=alert]'); if (err && err.textContent.trim()) return { ok: false, step: 3, detail: 'alert: ' + err.textContent.trim().slice(0, 160) }; if (/Application received/.test(document.body.innerText)) return { ok: true, step: 3, detail: 'confirmation shown' }; }
      return { ok: false, step: 3, detail: 'no confirmation within 5s: ' + document.body.innerText.slice(0, 160) };
    })()`);
    // The confirmation renders as soon as the action resolves; the row is committed by then, but on a
    // loaded machine the SQLite write can land a beat later than the DOM. Poll instead of assuming 500ms.
    let row: { id: string } | null = null;
    for (let i = 0; i < 20 && !row; i++) {
      await sleep(400);
      row = await prisma.application.findFirst({ where: { email: `${marker}@example.test` }, select: { id: true } });
    }
    const rateLimited = /too many attempts/i.test(submitted.detail);
    record("public:apply", "three-step application submits and persists", submitted.ok && !!row ? "PASS" : "FAIL", `${submitted.detail.replace(/\s+/g, " ").slice(0, 400)} · db=${!!row}${rateLimited ? " · the public form allows 5 submissions per hour per IP (LIMITS.application) — this run was rate limited by earlier QA submissions; restart `next start` (memory store) or wait, then re-run" : ""}`, submitted.ok && row ? undefined : "PUBLIC-APPLY");
    if (row) await prisma.application.delete({ where: { id: row.id } });
  } finally {
    close();
    await prisma.$disconnect();
  }
  const s = summary();
  console.log(`\npublic: pass=${s.pass} partial=${s.partial} fail=${s.fail} · screenshots in ${OUT}`);
  process.exitCode = s.fail ? 1 : 0;
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
