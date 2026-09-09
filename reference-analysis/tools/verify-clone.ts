/**
 * CLONE VERIFICATION — the VERIFY stage of the component-first clean-room
 * workflow. Opens a frozen clone (reference-analysis/clones/<name>/index.html)
 * in headless Chrome at each width, measures it with the same routine used for
 * the reference capture, screenshots it, and compares every element that
 * carries `data-ref="<reference node path>"` against the reference measure
 * file. Geometry is compared relative to the component root, so the clone can
 * sit alone on a page and still be checked against a component that lived in
 * the middle of one.
 *
 *   npx tsx reference-analysis/tools/verify-clone.ts <site> <name> [--widths=1440,1024,768,390] [--port=9448] [--tolerance=4]
 *
 * Writes reference-analysis/clones/<name>/verify/<width>.{jpg,measure.json} and
 * reference-analysis/clones/<name>/verify/report.json (+ a console summary).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { launchChrome, evaluate, open, setViewport, sleep, type Cdp } from "../../scripts/qa/cdp";

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith("--"));
const flag = (k: string) => args.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const [site, name] = positional;
if (!site || !name) { console.error("usage: verify-clone.ts <site> <name> [--widths=] [--port=] [--tolerance=]"); process.exit(1); }
const WIDTHS = (flag("widths") ?? "1440,1024,768,390").split(",").map(Number);
const PORT = Number(flag("port") ?? 9448);
const TOL = Number(flag("tolerance") ?? 4);
const CLONE = path.resolve("reference-analysis", "clones", name);
const refName = flag("ref") ?? (name.startsWith(`${site}-`) ? name.slice(site.length + 1) : name);
const REF = path.resolve("reference-analysis", site, "components", refName);
const OUT = path.join(CLONE, "verify");

type Node = { path: string; tag: string; text?: string; rel: { x: number; y: number; w: number; h: number }; typo?: Record<string, string>; box: Record<string, string>; motion: Record<string, string> };
type Measure = { root: { rect: { w: number; h: number }; box: Record<string, string> }; nodes: Node[] };

const MEASURE = `(() => {
  const root = document.querySelector('[data-tl-capture="root"]');
  if (!root) return null;
  const cs = (e) => getComputedStyle(e);
  const TYPO = ['fontFamily','fontSize','fontWeight','fontStyle','lineHeight','letterSpacing','textTransform','color','textAlign','textDecorationLine'];
  const BOX = ['display','position','backgroundColor','backgroundImage','borderRadius','borderTopWidth','borderTopStyle','borderTopColor','boxShadow','paddingTop','paddingRight','paddingBottom','paddingLeft','marginTop','marginBottom','gap','columnGap','rowGap','gridTemplateColumns','flexDirection','alignItems','justifyContent','maxWidth','width','height','opacity','transform','overflow','zIndex'];
  const MOTION = ['transitionProperty','transitionDuration','transitionTimingFunction','transitionDelay','animationName','animationDuration','animationTimingFunction','animationIterationCount','animationDelay'];
  const pick = (e, keys) => Object.fromEntries(keys.map((k) => [k, cs(e)[k]]));
  const rect = (e) => { const b = e.getBoundingClientRect(); return { x: Math.round(b.x + scrollX), y: Math.round(b.y + scrollY), w: Math.round(b.width), h: Math.round(b.height) }; };
  const rootRect = rect(root);
  const nodes = [];
  for (const e of root.querySelectorAll('[data-ref]')) {
    const r = rect(e);
    const ownText = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).filter(Boolean).join(' ').slice(0, 120);
    nodes.push({ path: e.getAttribute('data-ref'), tag: e.tagName.toLowerCase(), text: ownText || undefined, rel: { x: r.x - rootRect.x, y: r.y - rootRect.y, w: r.w, h: r.h }, typo: ownText ? pick(e, TYPO) : undefined, box: pick(e, BOX), motion: pick(e, MOTION) });
  }
  return { viewport: { w: innerWidth, h: innerHeight }, root: { rect: rootRect, box: pick(root, BOX) }, nodes, docHeight: document.documentElement.scrollHeight };
})()`;

async function shot(cdp: Cdp): Promise<Buffer> {
  const r = await evaluate<{ x: number; y: number; w: number; h: number }>(cdp, `(() => { const b = document.querySelector('[data-tl-capture="root"]').getBoundingClientRect(); return { x: b.x + scrollX, y: b.y + scrollY, w: b.width, h: Math.min(b.height, innerHeight * 3) }; })()`);
  const res = (await cdp.send("Page.captureScreenshot", { format: "jpeg", quality: 82, clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 1 }, captureBeyondViewport: true })) as { data: string };
  return Buffer.from(res.data, "base64");
}

const num = (s: string) => parseFloat(s) || 0;

async function main() {
  const file = path.join(CLONE, "index.html");
  if (!existsSync(file)) throw new Error(`no clone at ${file}`);
  mkdirSync(OUT, { recursive: true });
  const { cdp, close } = await launchChrome({ port: PORT, profileDir: path.join("reference-analysis", "clones", ".chrome-profile") });
  const report: Record<string, unknown>[] = [];
  try {
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    for (const width of WIDTHS) {
      const refFile = path.join(REF, `${width}.measure.json`);
      if (!existsSync(refFile)) { console.log(`@${width}: no reference measure, skipped`); continue; }
      const ref = JSON.parse(readFileSync(refFile, "utf8")) as Measure;
      await setViewport(cdp, width, 900);
      await open(cdp, pathToFileURL(file).href, 900);
      await evaluate(cdp, `document.fonts ? document.fonts.ready.then(() => true) : true`);
      await sleep(400);
      const clone = await evaluate<Measure & { docHeight: number }>(cdp, MEASURE);
      if (!clone) throw new Error("clone has no [data-tl-capture=root]");
      writeFileSync(path.join(OUT, `${width}.measure.json`), JSON.stringify(clone, null, 2));
      writeFileSync(path.join(OUT, `${width}.jpg`), await shot(cdp));
      const byPath = new Map(ref.nodes.map((n) => [n.path, n]));
      const rows: Record<string, unknown>[] = [];
      let worst = 0, compared = 0, missing = 0, styleMismatch = 0;
      for (const n of clone.nodes) {
        const r = byPath.get(n.path);
        if (!r) { missing++; rows.push({ ref: n.path, status: "no reference node" }); continue; }
        compared++;
        const d = { dx: n.rel.x - r.rel.x, dy: n.rel.y - r.rel.y, dw: n.rel.w - r.rel.w, dh: n.rel.h - r.rel.h };
        const geomMax = Math.max(Math.abs(d.dx), Math.abs(d.dy), Math.abs(d.dw), Math.abs(d.dh));
        worst = Math.max(worst, geomMax);
        const style: Record<string, [string, string]> = {};
        for (const k of ["borderRadius", "borderTopWidth", "paddingTop", "paddingLeft", "gap"]) {
          if (Math.abs(num(n.box[k]) - num(r.box[k])) > 1) style[k] = [r.box[k], n.box[k]];
        }
        for (const k of ["backgroundColor"]) { if (n.box[k] !== r.box[k]) style[k] = [r.box[k], n.box[k]]; }
        if (n.typo && r.typo) {
          for (const k of ["fontSize", "lineHeight", "letterSpacing"]) { if (Math.abs(num(n.typo[k]) - num(r.typo[k])) > 0.6) style[k] = [r.typo[k], n.typo[k]]; }
          for (const k of ["fontWeight", "textTransform", "color"]) { if (n.typo[k] !== r.typo[k]) style[k] = [r.typo[k], n.typo[k]]; }
        }
        if (Object.keys(style).length) styleMismatch++;
        rows.push({ ref: n.path, tag: n.tag, text: (r.text ?? "").slice(0, 30), geom: d, ok: geomMax <= TOL, style });
      }
      const rootDelta = { dw: clone.root.rect.w - ref.root.rect.w, dh: clone.root.rect.h - ref.root.rect.h };
      const pass = rows.filter((x) => x.ok).length;
      console.log(`@${width}: root Δw=${rootDelta.dw} Δh=${rootDelta.dh} · ${compared} nodes compared, ${pass} within ${TOL}px, worst ${worst}px, ${styleMismatch} with style differences, ${missing} unmatched`);
      for (const row of rows.filter((x) => !x.ok || Object.keys((x.style as object) ?? {}).length)) console.log("   ", JSON.stringify(row));
      report.push({ width, rootDelta, compared, pass, worst, styleMismatch, missing, rows });
    }
    writeFileSync(path.join(OUT, "report.json"), JSON.stringify({ site, name, verifiedAt: new Date().toISOString(), tolerancePx: TOL, widths: report }, null, 2));
  } finally {
    close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
