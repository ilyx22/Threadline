/**
 * COMPONENT CAPTURE — the OBSERVE / CAPTURE / MEASURE stages of the
 * component-first clean-room workflow (see docs/design/COMPONENT_RECONSTRUCTION.md).
 *
 * For one public page and one component (found by a heading or anchor text),
 * this records exactly what a normal visitor's browser can observe:
 *   - the component's bounding box and every descendant's box + computed style
 *     (typography, box model, borders, radii, shadows, transitions, animations);
 *   - a viewport screenshot clipped to the component, at each requested width;
 *   - optional interaction states: hover a selector, click a selector, and the
 *     same measurement again after each state change;
 *   - CSS keyframes exposed through CSSOM (same-origin sheets only).
 *
 * Nothing here touches source maps, private repositories, authenticated areas
 * or infrastructure. Output lives under reference-analysis/<site>/components/
 * and is never served by Threadline.
 *
 *   npx tsx reference-analysis/tools/capture-component.ts <site> <url> "<anchor text>" <name> [--widths=1440,768,390] [--hover=css] [--click=css,css] [--port=9444]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { launchChrome, evaluate, open, setViewport, screenshot, sleep, type Cdp } from "../../scripts/qa/cdp";

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith("--"));
const flag = (k: string) => args.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const [site, url, anchor, name] = positional;
if (!site || !url || !anchor || !name) {
  console.error('usage: capture-component.ts <site> <url> "<anchor text>" <name> [--widths=1440,768,390] [--hover=css] [--click=css,css] [--port=9444]');
  process.exit(1);
}
const WIDTHS = (flag("widths") ?? "1440,1024,768,390").split(",").map(Number);
const HOVER = flag("hover");
const CLICKS = (flag("click") ?? "").split(",").filter(Boolean);
const PORT = Number(flag("port") ?? 9444);
const CLIMB = flag("climb") ?? "auto"; // auto | section
const ROOT = path.resolve("reference-analysis", site, "components", name);

const FIND = (text: string) => `(() => {
  const needle = ${JSON.stringify(text)}.toLowerCase();
  const climb = ${JSON.stringify(CLIMB)};
  const all = [...document.querySelectorAll('h1,h2,h3,h4,p,span,a,button,div')];
  const area = (e) => { const b = e.getBoundingClientRect(); return b.width * b.height; };
  const hits = all.filter((e) => (e.innerText || '').trim().toLowerCase().includes(needle) && e.getBoundingClientRect().height > 0);
  if (hits.length === 0) return null;
  // the smallest element that contains the text is the actual heading, not a page wrapper
  const hit = hits.sort((a, b) => area(a) - area(b))[0];
  let node = hit;
  // climb to the nearest section-like ancestor (a <section>, or a block wider than 60% of the viewport)
  while (node.parentElement && node.parentElement !== document.body) {
    const tag = node.tagName.toLowerCase();
    const w = node.getBoundingClientRect().width;
    if (tag === 'section') break;
    if (climb === 'auto' && w > innerWidth * 0.6 && node.querySelectorAll('h1,h2,h3').length >= 1 && node.getBoundingClientRect().height > 200) break;
    node = node.parentElement;
  }
  node.setAttribute('data-tl-capture', 'root');
  node.scrollIntoView({ block: 'start' });
  return true;
})()`;

const MEASURE = `(() => {
  const root = document.querySelector('[data-tl-capture="root"]');
  if (!root) return null;
  const cs = (e) => getComputedStyle(e);
  const TYPO = ['fontFamily','fontSize','fontWeight','fontStyle','lineHeight','letterSpacing','textTransform','color','textAlign','textDecorationLine'];
  const BOX = ['display','position','backgroundColor','backgroundImage','borderRadius','borderTopWidth','borderTopStyle','borderTopColor','boxShadow','paddingTop','paddingRight','paddingBottom','paddingLeft','marginTop','marginBottom','gap','columnGap','rowGap','gridTemplateColumns','flexDirection','alignItems','justifyContent','maxWidth','width','height','opacity','transform','overflow','zIndex'];
  const MOTION = ['transitionProperty','transitionDuration','transitionTimingFunction','transitionDelay','animationName','animationDuration','animationTimingFunction','animationIterationCount','animationDelay'];
  const pick = (e, keys) => Object.fromEntries(keys.map((k) => [k, cs(e)[k]]));
  const rect = (e) => { const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y + scrollY), w: Math.round(b.width), h: Math.round(b.height) }; };
  const rootRect = rect(root);
  const nodes = [];
  const walk = (e, depth, idx) => {
    if (nodes.length > 600) return;
    const b = e.getBoundingClientRect();
    if (b.width === 0 && b.height === 0) return;
    const ownText = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).filter(Boolean).join(' ').slice(0, 120);
    const r = rect(e);
    nodes.push({ i: nodes.length, depth, path: idx, tag: e.tagName.toLowerCase(), cls: String(e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className).slice(0, 80), id: e.id || undefined, role: e.getAttribute('role') || undefined, text: ownText || undefined, rel: { x: r.x - rootRect.x, y: r.y - rootRect.y, w: r.w, h: r.h }, typo: ownText ? pick(e, TYPO) : undefined, box: pick(e, BOX), motion: pick(e, MOTION), svg: e.tagName.toLowerCase() === 'svg' ? { viewBox: e.getAttribute('viewBox'), paths: e.querySelectorAll('path,rect,circle,line,polyline').length } : undefined });
    let k = 0;
    for (const c of e.children) { walk(c, depth + 1, idx + '/' + k++); }
  };
  walk(root, 0, '0');
  const keyframes = [];
  for (const sheet of document.styleSheets) { let rules; try { rules = sheet.cssRules; } catch { continue; } for (const r of rules) { if (r.type === 7) keyframes.push({ name: r.name, frames: [...r.cssRules].map((k) => k.keyText + ' { ' + k.style.cssText.slice(0, 200) + ' }') }); } }
  const fonts = [...new Set([...document.fonts].map((f) => f.family + ' ' + f.weight + ' ' + f.style))];
  return { viewport: { w: innerWidth, h: innerHeight }, root: { tag: root.tagName.toLowerCase(), cls: String(root.className).slice(0, 120), rect: rootRect, box: pick(root, BOX) }, nodes, keyframes, fonts };
})()`;

async function clip(cdp: Cdp): Promise<Buffer> {
  const r = await evaluate<{ x: number; y: number; w: number; h: number } | null>(cdp, `(() => { const e = document.querySelector('[data-tl-capture="root"]'); if (!e) return null; const b = e.getBoundingClientRect(); return { x: Math.max(0, b.x + scrollX), y: Math.max(0, b.y + scrollY), w: Math.min(innerWidth, b.width), h: Math.min(innerHeight * 3, b.height) }; })()`);
  if (!r) return screenshot(cdp, { format: "jpeg", quality: 80 });
  const res = (await cdp.send("Page.captureScreenshot", { format: "jpeg", quality: 82, clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 1 }, captureBeyondViewport: true })) as { data: string };
  return Buffer.from(res.data, "base64");
}

/** Selector helper: a plain CSS selector, or `text=<visible text>` to find a clickable element by its text within the captured root. */
const FINDER = (selector: string) => selector.startsWith("text=")
  ? `(() => { const t = ${JSON.stringify(selector.slice(5).toLowerCase())}; const root = document.querySelector('[data-tl-capture="root"]') || document; const norm = (x) => (x || '').replace(/\\s+/g, ' ').trim().toLowerCase(); const vis = (e) => e.getBoundingClientRect().height > 0; const smallest = (list) => list.sort((a, b) => (a.getBoundingClientRect().width * a.getBoundingClientRect().height) - (b.getBoundingClientRect().width * b.getBoundingClientRect().height))[0] || null; const interactive = [...root.querySelectorAll('button,a,[role=tab],[role=button],summary,label,input')].filter((e) => vis(e) && norm(e.innerText || e.value).includes(t)); if (interactive.length) return smallest(interactive); return smallest([...root.querySelectorAll('li,div,span,p')].filter((e) => vis(e) && norm(e.innerText).includes(t))); })()`
  : `document.querySelector(${JSON.stringify(selector)})`;

async function mouseTo(cdp: Cdp, selector: string) {
  const c = await evaluate<{ x: number; y: number } | null>(cdp, `(() => { const e = ${FINDER(selector)}; if (!e) return null; e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; })()`);
  if (!c) return false;
  await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: c.x, y: c.y });
  return true;
}

async function click(cdp: Cdp, selector: string) {
  const ok = await mouseTo(cdp, selector);
  if (!ok) return false;
  const c = await evaluate<{ x: number; y: number }>(cdp, `(() => { const b = (${FINDER(selector)}).getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; })()`);
  await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: c.x, y: c.y, button: "left", clickCount: 1 });
  await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: c.x, y: c.y, button: "left", clickCount: 1 });
  return true;
}

async function main() {
  mkdirSync(ROOT, { recursive: true });
  const { cdp, close } = await launchChrome({ port: PORT, profileDir: path.join("reference-analysis", site, "cache", `.chrome-profile-${PORT}`) });
  const log: Record<string, unknown>[] = [];
  try {
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    for (const width of WIDTHS) {
      await setViewport(cdp, width, 900);
      await open(cdp, url, 1500);
      // let lazy/reveal content settle: scroll the page once, then return to the component
      await evaluate(cdp, `new Promise((r) => { let y = 0; const t = setInterval(() => { y += 600; scrollTo(0, y); if (y > document.documentElement.scrollHeight) { clearInterval(t); scrollTo(0, 0); r(true); } }, 40); })`);
      await sleep(400);
      const found = await evaluate<boolean | null>(cdp, FIND(anchor));
      if (!found) { console.log(`@${width}: anchor not found`); log.push({ width, found: false }); continue; }
      await sleep(900);
      const base = path.join(ROOT, `${width}`);
      const data = await evaluate<Record<string, unknown>>(cdp, MEASURE);
      writeFileSync(`${base}.measure.json`, JSON.stringify(data, null, 2));
      writeFileSync(`${base}.default.jpg`, await clip(cdp));
      const states: Record<string, unknown>[] = [{ state: "default" }];
      if (HOVER) {
        const ok = await mouseTo(cdp, HOVER);
        await sleep(500);
        if (ok) { writeFileSync(`${base}.hover.jpg`, await clip(cdp)); writeFileSync(`${base}.hover.measure.json`, JSON.stringify(await evaluate(cdp, MEASURE), null, 2)); }
        states.push({ state: "hover", selector: HOVER, ok });
      }
      let n = 0;
      for (const sel of CLICKS) {
        const ok = await click(cdp, sel);
        await sleep(700);
        if (ok) { writeFileSync(`${base}.click${n}.jpg`, await clip(cdp)); writeFileSync(`${base}.click${n}.measure.json`, JSON.stringify(await evaluate(cdp, MEASURE), null, 2)); }
        states.push({ state: `click${n}`, selector: sel, ok });
        n++;
      }
      const d = data as { root: { rect: { w: number; h: number } }; nodes: unknown[] };
      console.log(`@${width}: root ${d.root.rect.w}x${d.root.rect.h}, ${d.nodes.length} nodes, states ${states.map((s) => s.state).join("/")}`);
      log.push({ width, found: true, root: d.root.rect, nodes: d.nodes.length, states });
    }
    writeFileSync(path.join(ROOT, "capture.json"), JSON.stringify({ site, url, anchor, name, capturedAt: new Date().toISOString(), method: "headless Chrome via CDP; public page; rendered DOM + computed styles + screenshots only", widths: WIDTHS, log }, null, 2));
  } finally {
    close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
