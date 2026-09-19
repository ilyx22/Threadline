/**
 * VISUAL + GEOMETRY BASELINE for the public product.
 *
 *   node scripts/qa/run.cjs visual-capture            → writes qa-baselines/public/<width>-<route>.jpg + geometry.json
 *   node scripts/qa/run.cjs visual-capture --compare  → compares against the committed baseline, reports largest deltas
 *
 * Frame-accurate: every page is scrolled through with requestAnimationFrame
 * steps so IntersectionObserver reveals fire (expected vs fired reveals are
 * reported), smooth scrolling is forced off, and the capture waits for the
 * scroll position to settle before measuring. Geometry is compared against
 * THREADLINE'S OWN approved baseline — never against a reference site.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { launchChrome, evaluate, open, screenshot, scrollThrough, setViewport } from "./cdp";

/** OneDrive briefly locks a file it is syncing; a capture must not die on that. */
async function writeWithRetry(file: string, data: Buffer | string, tries = 6) {
  for (let i = 0; ; i++) {
    try {
      writeFileSync(file, data);
      return;
    } catch (e) {
      const code = (e as NodeJS.ErrnoException).code;
      if (i >= tries - 1 || !(code === "UNKNOWN" || code === "EBUSY" || code === "EPERM")) throw e;
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
}


const BASE = (process.env.QA_BASE ?? "http://localhost:3000").replace(/\/$/, "");
const compare = process.argv.includes("--compare");
const DIR = path.resolve("qa-baselines/public");
const NEW = compare ? path.resolve("qa-baselines/public/.candidate") : DIR;
const WIDTHS = [1440, 1024, 768, 390, 320];
const ROUTES: [string, string][] = [["/", "home"], ["/how-it-works", "how-it-works"], ["/who-its-for", "who-its-for"], ["/playbook", "playbook"], ["/apply", "apply"], ["/login", "login"]];

const GEOMETRY = `(() => {
  const sel = ['header', 'main', 'footer', 'h1', 'h2', 'a[href="/apply"]', '.tl-card', '[data-machine-progress]', 'form', 'nav'];
  const out = [];
  for (const s of sel) { const els = [...document.querySelectorAll(s)].slice(0, 6); els.forEach((e, i) => { const b = e.getBoundingClientRect(); if (b.width > 0) out.push({ key: s + '#' + i, x: Math.round(b.x), y: Math.round(b.y + scrollY), w: Math.round(b.width), h: Math.round(b.height) }); }); }
  const reveals = [...document.querySelectorAll('[data-shown]')];
  return { docHeight: document.documentElement.scrollHeight, elements: out, revealsExpected: reveals.length, revealsFired: reveals.filter((r) => r.getAttribute('data-shown') === 'true').length };
})()`;

type Geo = { docHeight: number; elements: { key: string; x: number; y: number; w: number; h: number }[]; revealsExpected: number; revealsFired: number };

async function main() {
  mkdirSync(NEW, { recursive: true });
  const { cdp, close } = await launchChrome({ profileDir: path.join(DIR, ".chrome-profile") });
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  const geometry: Record<string, Geo> = {};
  try {
    for (const width of WIDTHS) {
      await setViewport(cdp, width, 900);
      for (const [route, name] of ROUTES) {
        await open(cdp, `${BASE}${route}`, 800);
        await scrollThrough(cdp, 300);
        await evaluate(cdp, "new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))");
        const geo = await evaluate<Geo>(cdp, GEOMETRY);
        geometry[`${width}-${name}`] = geo;
        await writeWithRetry(path.join(NEW, `${width}-${name}.jpg`), await screenshot(cdp, { fullPage: true, format: "jpeg", quality: 72 }));
        console.log(`${width} ${route}: h=${geo.docHeight} reveals ${geo.revealsFired}/${geo.revealsExpected}${geo.revealsFired !== geo.revealsExpected ? "  <-- not all reveals fired; do not trust a diff" : ""}`);
      }
    }
    await writeWithRetry(path.join(NEW, "geometry.json"), JSON.stringify({ capturedAt: new Date().toISOString(), base: BASE, geometry }, null, 2));

    if (compare) {
      const basePath = path.join(DIR, "geometry.json");
      if (!existsSync(basePath)) { console.log("no baseline geometry to compare against"); return; }
      const baseline = JSON.parse(readFileSync(basePath, "utf8")) as { geometry: Record<string, Geo> };
      let worst = { key: "", dx: 0, dy: 0, dw: 0, dh: 0, dDoc: 0 };
      for (const [k, geo] of Object.entries(geometry)) {
        const b = baseline.geometry[k];
        if (!b) { console.log(`${k}: new page/width (no baseline)`); continue; }
        const dDoc = Math.abs(geo.docHeight - b.docHeight);
        for (const el of geo.elements) {
          const be = b.elements.find((x) => x.key === el.key);
          if (!be) continue;
          const d = { dx: Math.abs(el.x - be.x), dy: Math.abs(el.y - be.y), dw: Math.abs(el.w - be.w), dh: Math.abs(el.h - be.h) };
          if (Math.max(d.dx, d.dy, d.dw, d.dh) > Math.max(worst.dx, worst.dy, worst.dw, worst.dh)) worst = { key: `${k} ${el.key}`, ...d, dDoc };
        }
        console.log(`${k}: docHeight ${b.docHeight} → ${geo.docHeight} (Δ${dDoc})`);
      }
      console.log(`largest delta: ${worst.key} Δx=${worst.dx} Δy=${worst.dy} Δw=${worst.dw} Δh=${worst.dh}`);
    }
  } finally {
    close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
