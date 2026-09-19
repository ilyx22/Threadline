/**
 * WEB VITALS SANITY — LCP and CLS on the public homepage, measured in the
 * page with PerformanceObserver at desktop and phone widths against the
 * running site (QA_BASE, default :3000). A sanity check, not a lab score:
 * the machine, the network and the build mode all move the numbers.
 *
 *   node scripts/qa/run.cjs web-vitals
 */
import path from "node:path";
import { record, section, summary } from "./context";
import { evaluate, launchChrome, open, setViewport, sleep } from "./cdp";

const BASE = (process.env.QA_BASE ?? "http://localhost:3000").replace(/\/$/, "");
const OUT = path.resolve("scripts/qa/.shots/web-vitals");
const BUDGET = { lcp: 2500, cls: 0.1 };

const OBSERVE = `(() => {
  window.__vitals = { lcp: 0, cls: 0 };
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__vitals.lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__vitals.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
})()`;

async function main() {
  const { cdp, close } = await launchChrome({ profileDir: path.join(OUT, ".chrome-profile") });
  try {
    section("web vitals — homepage");
    for (const [w, h] of [[1440, 900], [390, 844]] as const) {
      await setViewport(cdp, w, h);
      await cdp.send("Page.enable");
      await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: OBSERVE });
      await open(cdp, `${BASE}/?vitals=${w}`, 4500);
      // scroll a little so late layout shifts (fonts, images) would register
      await evaluate(cdp, `window.scrollTo(0, 400); true`);
      await sleep(800);
      const v = (await evaluate<{ lcp: number; cls: number } | null>(cdp, `window.__vitals || null`)) ?? { lcp: 0, cls: 0 };
      record("vitals", `LCP at ${w}px`, v.lcp > 0 && v.lcp <= BUDGET.lcp ? "PASS" : v.lcp > 0 ? "PARTIAL" : "FAIL", `${Math.round(v.lcp)} ms (budget ${BUDGET.lcp})`);
      record("vitals", `CLS at ${w}px`, v.cls <= BUDGET.cls ? "PASS" : "FAIL", `${v.cls.toFixed(3)} (budget ${BUDGET.cls})`, v.cls > BUDGET.cls ? "CLS" : undefined);
    }
  } finally {
    close();
  }
  const s = summary();
  console.log(`\nweb-vitals: pass=${s.pass} partial=${s.partial} fail=${s.fail}`);
  process.exit(s.fail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
