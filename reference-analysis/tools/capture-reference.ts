/**
 * REFERENCE CAPTURE — observational cache of a public website, taken the way a
 * normal browser sees it: rendered DOM, computed styles, geometry, fonts, the
 * animations exposed by CSSOM, and screenshots at a ladder of widths.
 *
 * Clean-room rules (see reference-analysis/birdhouse/forbidden-to-copy.md):
 * nothing here fetches source repositories, source maps or private systems,
 * and nothing captured here is ever served by Threadline. Output lives under
 * reference-analysis/<site>/ which is outside src/ and public/.
 *
 *   npx tsx reference-analysis/tools/capture-reference.ts birdhouse https://thebirdhouse.co/ https://www.thebirdhouse.email/x-playbook
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { launchChrome, evaluate, open, scrollThrough, setViewport, screenshot, sleep } from "../../scripts/qa/cdp";

const [site = "birdhouse", ...urls] = process.argv.slice(2);
const ROOT = path.resolve("reference-analysis", site);
const WIDTHS = [1920, 1600, 1440, 1366, 1280, 1200, 1024, 900, 820, 768, 760, 720, 640, 600, 500, 460, 430, 390, 375, 320];
const DEEP = new Set([1440, 1024, 768, 390]);

const slug = (u: string) => u.replace(/^https?:\/\//, "").replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "").slice(0, 60) || "root";

const EXTRACT = `(() => {
  const d = document;
  const cs = (e) => getComputedStyle(e);
  const vis = (e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
  const pick = (e, keys) => Object.fromEntries(keys.map((k) => [k, cs(e)[k]]));
  const TYPO = ['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','textTransform','color','fontStyle'];
  const BOX = ['backgroundColor','borderRadius','border','boxShadow','padding','maxWidth','width','height'];
  const rect = (e) => { const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y + scrollY), w: Math.round(b.width), h: Math.round(b.height) }; };
  const sample = (sel, n, keys) => [...d.querySelectorAll(sel)].filter(vis).slice(0, n).map((e) => ({ tag: e.tagName.toLowerCase(), text: (e.innerText || e.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 90), rect: rect(e), style: pick(e, keys) }));
  // colour census
  const colours = {};
  for (const e of d.querySelectorAll('body *')) { if (!vis(e)) continue; const s = cs(e); for (const k of ['backgroundColor','color','borderTopColor']) { const v = s[k]; if (!v || v === 'rgba(0, 0, 0, 0)' || v === 'transparent') continue; colours[v] = (colours[v] || 0) + 1; } }
  const topColours = Object.entries(colours).sort((a, b) => b[1] - a[1]).slice(0, 40);
  // fonts
  const fonts = [...new Set([...d.fonts].map((f) => f.family + ' ' + f.weight + ' ' + f.style))];
  const families = {};
  for (const e of d.querySelectorAll('h1,h2,h3,h4,p,a,button,li,span,div')) { if (!vis(e) || !(e.innerText||'').trim()) continue; const f = cs(e).fontFamily.split(',')[0].replace(/"/g,''); families[f] = (families[f] || 0) + 1; }
  // radii / shadows
  const radii = {}, shadows = {}, easings = {};
  for (const e of d.querySelectorAll('body *')) { if (!vis(e)) continue; const s = cs(e); if (s.borderRadius && s.borderRadius !== '0px') radii[s.borderRadius] = (radii[s.borderRadius]||0)+1; if (s.boxShadow && s.boxShadow !== 'none') shadows[s.boxShadow] = (shadows[s.boxShadow]||0)+1; if (s.transitionTimingFunction && s.transitionDuration !== '0s') easings[s.transitionTimingFunction + ' ' + s.transitionDuration] = (easings[s.transitionTimingFunction + ' ' + s.transitionDuration]||0)+1; }
  // animations exposed through CSSOM (same-origin sheets only)
  const keyframes = [], animated = [];
  for (const sheet of d.styleSheets) { let rules; try { rules = sheet.cssRules; } catch { continue; } for (const r of rules) { if (r.type === 7) keyframes.push({ name: r.name, frames: [...r.cssRules].map((k) => k.keyText + ' { ' + k.style.cssText.slice(0, 160) + ' }') }); } }
  for (const e of d.querySelectorAll('body *')) { const s = cs(e); if (s.animationName && s.animationName !== 'none') animated.push({ tag: e.tagName.toLowerCase(), cls: String(e.className).slice(0, 60), name: s.animationName, duration: s.animationDuration, timing: s.animationTimingFunction, iteration: s.animationIterationCount, delay: s.animationDelay }); }
  // structure
  const sections = [...d.querySelectorAll('main > *, body > div > section, section, header, footer, nav')].filter(vis).filter((e) => e.getBoundingClientRect().height > 80).slice(0, 60).map((e) => ({ tag: e.tagName.toLowerCase(), id: e.id, cls: String(e.className).slice(0, 80), rect: rect(e), bg: cs(e).backgroundColor, heading: (e.querySelector('h1,h2,h3')?.innerText || '').trim().slice(0, 80) }));
  const containers = {};
  for (const e of d.querySelectorAll('body *')) { if (!vis(e)) continue; const mw = cs(e).maxWidth; if (mw && mw !== 'none') containers[mw] = (containers[mw]||0)+1; }
  const nav = [...d.querySelectorAll('header a, nav a')].filter(vis).map((a) => ({ text: a.innerText.trim().slice(0, 40), href: a.getAttribute('href') })).slice(0, 30);
  const ctas = [...d.querySelectorAll('a,button')].filter(vis).filter((e) => { const s = cs(e); return s.backgroundColor !== 'rgba(0, 0, 0, 0)' && (e.innerText||'').trim().length > 0 && (e.innerText||'').trim().length < 40; }).slice(0, 25).map((e) => ({ text: e.innerText.trim(), rect: rect(e), style: pick(e, ['backgroundColor','color','borderRadius','border','boxShadow','fontSize','fontWeight','padding','textTransform','letterSpacing']) }));
  const media = { img: d.images.length, svg: d.querySelectorAll('svg').length, video: d.querySelectorAll('video').length, canvas: d.querySelectorAll('canvas').length, lottie: d.querySelectorAll('lottie-player,[data-lottie],dotlottie-player').length, imgSrcs: [...d.images].slice(0, 40).map((i) => ({ src: (i.currentSrc || i.src).slice(0, 140), w: i.naturalWidth, h: i.naturalHeight, alt: i.alt.slice(0, 60) })) };
  const scripts = [...d.scripts].map((s) => s.src).filter(Boolean).map((s) => s.replace(/^https?:\\/\\//, '').slice(0, 90)).slice(0, 40);
  const links = [...d.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((h) => h && !h.startsWith('#') && !h.startsWith('mailto:')).slice(0, 80);
  const meta = Object.fromEntries([...d.querySelectorAll('meta[name],meta[property]')].map((m) => [m.getAttribute('name') || m.getAttribute('property'), (m.getAttribute('content') || '').slice(0, 160)]));
  return {
    url: location.href, title: d.title, viewport: { w: innerWidth, h: innerHeight }, scrollHeight: d.documentElement.scrollHeight,
    meta, fonts, families, topColours, radii: Object.entries(radii).sort((a,b)=>b[1]-a[1]).slice(0,15), shadows: Object.entries(shadows).sort((a,b)=>b[1]-a[1]).slice(0,10), easings: Object.entries(easings).sort((a,b)=>b[1]-a[1]).slice(0,12),
    keyframes: keyframes.slice(0, 40), animated: animated.slice(0, 60), sections, containers: Object.entries(containers).sort((a,b)=>b[1]-a[1]).slice(0,10), nav, ctas, media, scripts, links,
    typography: { h1: sample('h1', 3, TYPO), h2: sample('h2', 6, TYPO), h3: sample('h3', 6, TYPO), p: sample('p', 8, TYPO), small: sample('small, .caption, [class*=eyebrow], [class*=label]', 6, TYPO) },
    cards: sample('[class*=card], article, li > div', 10, BOX),
    bodyBg: cs(d.body).backgroundColor, htmlBg: cs(d.documentElement).backgroundColor,
    text: d.body.innerText.replace(/\\s+/g, ' ').slice(0, 12000),
  };
})()`;

async function main() {
  if (urls.length === 0) throw new Error("give at least one URL");
  const { cdp, close } = await launchChrome({ profileDir: path.join(ROOT, "cache", ".chrome-profile") });
  const verify: Record<string, unknown>[] = [];
  try {
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Network.enable");
    const requests: { url: string; type: string; size?: number }[] = [];
    cdp.on("Network.responseReceived", (p) => { const r = p.response as { url: string; mimeType: string }; requests.push({ url: r.url.slice(0, 160), type: r.mimeType }); });

    for (const url of urls) {
      const name = slug(url);
      for (const dir of ["screenshots", "responsive", "dom", "geometry", "styles", "typography", "motion", "assets", "verify"]) mkdirSync(path.join(ROOT, dir), { recursive: true });
      for (const width of WIDTHS) {
        await setViewport(cdp, width, 900);
        requests.length = 0;
        const t = Date.now();
        await open(cdp, url, 1500);
        const scrolled = await scrollThrough(cdp, 300);
        await sleep(600);
        if (DEEP.has(width)) {
          const data = await evaluate<Record<string, unknown>>(cdp, EXTRACT);
          const base = `${name}-${width}`;
          const { text, sections, typography, cards, ctas, keyframes, animated, easings, media, scripts, links, meta, ...rest } = data as Record<string, unknown> & { text: string };
          writeFileSync(path.join(ROOT, "dom", `${base}.text.txt`), String(text));
          writeFileSync(path.join(ROOT, "dom", `${base}.links.json`), JSON.stringify({ links, meta, scripts }, null, 2));
          writeFileSync(path.join(ROOT, "geometry", `${base}.json`), JSON.stringify({ sections, ctas }, null, 2));
          writeFileSync(path.join(ROOT, "styles", `${base}.json`), JSON.stringify({ ...rest, cards }, null, 2));
          writeFileSync(path.join(ROOT, "typography", `${base}.json`), JSON.stringify(typography, null, 2));
          writeFileSync(path.join(ROOT, "motion", `${base}.json`), JSON.stringify({ keyframes, animated, easings }, null, 2));
          writeFileSync(path.join(ROOT, "assets", `${base}.json`), JSON.stringify({ media, requests: requests.filter((r) => /image|font|video|svg/.test(r.type)) }, null, 2));
          writeFileSync(path.join(ROOT, "screenshots", `${base}-full.jpg`), await screenshot(cdp, { fullPage: true, format: "jpeg", quality: 70 }));
          verify.push({ url, width, finalUrl: (data as { url: string }).url, title: (data as { title: string }).title, scrollHeight: scrolled.height, frames: scrolled.frames, fonts: (data as { fonts: string[] }).fonts.length, ms: Date.now() - t });
        }
        writeFileSync(path.join(ROOT, "responsive", `${name}-${width}.jpg`), await screenshot(cdp, { fullPage: false, format: "jpeg", quality: 70 }));
        console.log(`${name} @${width}: h=${scrolled.height} frames=${scrolled.frames}`);
      }
    }
    writeFileSync(path.join(ROOT, "verify", `capture-${new Date().toISOString().slice(0, 10)}.json`), JSON.stringify({ capturedAt: new Date().toISOString(), method: "headless Chrome via CDP, public pages only, no source maps, no authenticated areas", results: verify }, null, 2));
    console.log("verify:", JSON.stringify(verify.map((v) => `${v.finalUrl} @${v.width} ${v.title}`), null, 1));
  } finally {
    close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
