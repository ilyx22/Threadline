/**
 * Probe: evaluate an expression on a page of the running server and print the result.
 *   node scripts/qa/run.cjs probe --url=/ --width=1440 --expr="document.title"
 *   Flags: --file=<js file> instead of --expr; --wait=<ms> before evaluating; --after=<ms> between evaluating and --shot=<jpeg path>.
 */
import path from "node:path";
import { readFileSync } from "node:fs";
import { writeFileSync } from "node:fs";
import { launchChrome, evaluate, open, setViewport, sleep, screenshot } from "./cdp";

const args = process.argv.slice(2);
const flag = (k: string) => args.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const BASE = process.env.QA_BASE ?? "http://localhost:3000";

async function main() {
  const { cdp, close } = await launchChrome({ port: 9352, profileDir: path.join("scripts", "qa", ".shots", ".chrome-profile-probe") });
  try {
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    if (flag("session")) {
      await cdp.send("Network.enable");
      await cdp.send("Network.setCookie", { name: "threadline_session", value: flag("session"), url: BASE, httpOnly: true, path: "/" });
    }
    await setViewport(cdp, Number(flag("width") ?? 1440), 900);
    await open(cdp, `${BASE}${flag("url") ?? "/"}`, 1200);
    await sleep(Number(flag("wait") ?? 500));
    const expr = flag("file") ? readFileSync(flag("file") as string, "utf8") : (flag("expr") ?? "document.title");
    const out = await evaluate<unknown>(cdp, expr);
    console.log(JSON.stringify(out, null, 2));
    if (flag("after")) await sleep(Number(flag("after")));
    if (flag("shot")) { writeFileSync(flag("shot") as string, await screenshot(cdp, { fullPage: false, format: "jpeg", quality: 80 })); console.log("shot →", flag("shot")); }
  } finally {
    close();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
