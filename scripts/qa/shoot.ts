/**
 * Full-page screenshots of public routes on the running server, for inspection.
 *
 *   node scripts/qa/run.cjs shoot --out=<dir> [--widths=1440,390] [--routes=/,/how-it-works] [--session=<token from mint-session.ts>]
 *
 * Scrolls each page first so every reveal has fired, then captures the whole
 * document. Writes <out>/<width>-<slug>.jpg. Not a QA gate — a viewing aid.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { launchChrome, open, scrollThrough, setViewport, screenshot, sleep } from "./cdp";

const args = process.argv.slice(2);
const flag = (k: string) => args.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const OUT = flag("out") ?? path.join("scripts", "qa", ".shots", "full");
const WIDTHS = (flag("widths") ?? "1440,390").split(",").map(Number);
const ROUTES = (flag("routes") ?? "/,/how-it-works,/who-its-for,/playbook,/apply").split(",");
const BASE = process.env.QA_BASE ?? "http://localhost:3000";
const slug = (r: string) => (r === "/" ? "home" : r.replace(/^\//, "").replace(/[^a-z0-9]+/gi, "-"));

async function main() {
  mkdirSync(OUT, { recursive: true });
  const { cdp, close } = await launchChrome({ port: 9351, profileDir: path.join("scripts", "qa", ".shots", ".chrome-profile-shoot") });
  try {
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    const session = flag("session");
    if (session) {
      await cdp.send("Network.enable");
      await cdp.send("Network.setCookie", { name: "threadline_session", value: session, url: BASE, httpOnly: true, path: "/" });
    }
    for (const width of WIDTHS) {
      await setViewport(cdp, width, 900);
      for (const route of ROUTES) {
        await open(cdp, `${BASE}${route}`, 900);
        const s = await scrollThrough(cdp, 300);
        await sleep(700);
        const file = path.join(OUT, `${width}-${slug(route)}.jpg`);
        writeFileSync(file, await screenshot(cdp, { fullPage: true, format: "jpeg", quality: 78 }));
        console.log(`${width} ${route} h=${s.height} → ${file}`);
      }
    }
  } finally {
    close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
