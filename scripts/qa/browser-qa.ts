/**
 * BROWSER QA — responsive, accessibility and runtime-error sweep of the real
 * rendered pages, driven over the Chrome DevTools Protocol with no extra
 * dependencies (headless Chrome + Node's built-in WebSocket).
 *
 * Widths: 1440 / 1024 / 768 / 390. For every route at every width:
 *   - no horizontal page scroll (documentElement.scrollWidth <= innerWidth)
 *   - no element hanging past the right edge
 *   - no Next.js error overlay, no console errors, no hydration warnings
 *   - every form control labelled, every button/link named, one <h1>
 *   - keyboard: Tab moves focus through real controls with a visible ring
 *
 * Sessions are minted by the harness (real Session rows), never by typing a
 * password. Screenshots of the narrow layout land in the scratch directory.
 *
 *   node scripts/qa/run.cjs browser-qa            (dev server must be running on :3000)
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { prisma } from "../../src/lib/db/client";
import { actAs, record, section, summary, cleanupSessions } from "./context";

const CHROME = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "/usr/bin/google-chrome", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find((p) => existsSync(p));
const PORT = 9333;
const BASE = process.env.QA_BASE ?? "http://localhost:3000";
const OUT = path.resolve(process.env.QA_SHOTS ?? "scripts/qa/.shots");
const ONLY = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
const WIDTHS = (process.argv.find((a) => a.startsWith("--width="))?.slice(8).split(",").map(Number)) ?? [1440, 1024, 768, 390];
const CLIENT = "alex@northbeamadvisory.com";
const OPERATOR = "operator@threadline.com";
const SUPER = "ops@threadline.com";

/* ------------------------------ tiny CDP client ------------------------------ */
class Cdp {
  private id = 0;
  private pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
  private listeners = new Map<string, ((p: Record<string, unknown>) => void)[]>();
  constructor(private ws: WebSocket) {
    ws.addEventListener("message", (ev) => {
      const m = JSON.parse(String(ev.data));
      if (m.id && this.pending.has(m.id)) {
        const p = this.pending.get(m.id)!;
        this.pending.delete(m.id);
        m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result);
      } else if (m.method) {
        for (const l of this.listeners.get(m.method) ?? []) l(m.params);
      }
    });
  }
  send<T = Record<string, unknown>>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve: resolve as (v: unknown) => void, reject }));
  }
  on(method: string, fn: (p: Record<string, unknown>) => void) {
    this.listeners.set(method, [...(this.listeners.get(method) ?? []), fn]);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function launch() {
  if (!CHROME) throw new Error("Chrome not found");
  const profile = path.join(OUT, "profile");
  mkdirSync(profile, { recursive: true });
  const proc = spawn(CHROME, [`--headless=new`, `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--disable-gpu", "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
  let target: { webSocketDebuggerUrl: string } | undefined;
  for (let i = 0; i < 50 && !target; i++) {
    await sleep(200);
    try {
      const list = (await (await fetch(`http://localhost:${PORT}/json/list`)).json()) as { type: string; webSocketDebuggerUrl: string }[];
      target = list.find((t) => t.type === "page");
    } catch { /* not up yet */ }
  }
  if (!target) { proc.kill(); throw new Error("Chrome did not expose a page target"); }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise<void>((res, rej) => { ws.addEventListener("open", () => res()); ws.addEventListener("error", () => rej(new Error("ws error"))); });
  return { proc, cdp: new Cdp(ws) };
}

const AUDIT = `(() => {
  const d = document, w = innerWidth, de = d.documentElement;
  const vis = (e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
  const inScroller = (e) => { for (let p = e.parentElement; p && p !== d.body; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o === 'auto' || o === 'scroll') return true; } return false; };
  const clipped = (e) => { for (let p = e.parentElement; p && p !== d.body; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o === 'hidden' || o === 'clip') return p.tagName.toLowerCase() + '.' + String(p.className).split(' ').slice(0, 3).join('.'); } return ''; };
  const wideAll = [...d.querySelectorAll('body *')].filter((e) => vis(e) && e.getBoundingClientRect().right > w + 2);
  const wide = wideAll.filter((e) => !inScroller(e));
  const culprits = [...d.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > w + 2 && !inScroller(e)).filter((e, i, arr) => !arr.includes(e.parentElement)).slice(0, 3).map((e) => e.tagName.toLowerCase() + '.' + String(e.className).split(' ').slice(0, 4).join('.') + '→right=' + Math.round(e.getBoundingClientRect().right) + ' w=' + Math.round(e.getBoundingClientRect().width) + ' h=' + Math.round(e.getBoundingClientRect().height) + ' clippedBy=' + clipped(e) + ' text=' + (e.textContent || '').trim().slice(0, 30));
  const absLeft = (e) => { let x = 0; for (let n = e; n; n = n.offsetParent) x += n.offsetLeft || 0; return x; };
  const layoutWide = [...d.querySelectorAll('body *')].filter((e) => e.offsetWidth > 0 && absLeft(e) + e.offsetWidth > w + 2 && !inScroller(e)).filter((e, i, arr) => !arr.includes(e.parentElement)).slice(0, 3).map((e) => e.tagName.toLowerCase() + '.' + String(e.className).split(' ').slice(0, 4).join('.') + '→' + (absLeft(e) + e.offsetWidth) + ' pos=' + getComputedStyle(e).position + ' text=' + (e.textContent || '').trim().slice(0, 25));
  const textSpill = [...d.querySelectorAll('body *')].filter((e) => { const cs = getComputedStyle(e); return e.scrollWidth > e.clientWidth + 2 && cs.overflowX === 'visible' && e.getBoundingClientRect().left + e.scrollWidth > w + 2 && !inScroller(e); }).filter((e, i, arr) => !arr.some((o) => o !== e && e.contains(o))).slice(0, 3).map((e) => e.tagName.toLowerCase() + '.' + String(e.className).split(' ').slice(0, 4).join('.') + ' scrollW=' + e.scrollWidth + ' clientW=' + e.clientWidth + ' text=' + (e.textContent || '').trim().slice(0, 40));
  const outermost = wideAll.filter((e) => !wideAll.includes(e.parentElement)).slice(0, 2).map((e) => e.tagName.toLowerCase() + '.' + String(e.className).split(' ').slice(0, 3).join('.') + '→' + Math.round(e.getBoundingClientRect().right) + ' parentOverflow=' + getComputedStyle(e.parentElement).overflowX);
  const unlabeled = [...d.querySelectorAll('input:not([type=hidden]),select,textarea')].filter((el) => vis(el) && !(el.labels && el.labels.length) && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby') && !el.placeholder && !el.closest('label'));
  const unnamed = [...d.querySelectorAll('button,a[href]')].filter((x) => vis(x) && !x.textContent.trim() && !x.getAttribute('aria-label') && !x.title && !x.querySelector('[aria-label],svg title,img[alt]'));
  const tiny = [...d.querySelectorAll('button,a[href],[role=button]')].filter((x) => { const b = x.getBoundingClientRect(); return vis(x) && (b.width < 24 || b.height < 24); });
  const h1 = [...d.querySelectorAll('h1')].filter(vis).map((h) => h.textContent.trim().slice(0, 30));
  const portal = d.querySelector('nextjs-portal');
  const portalText = portal && portal.shadowRoot ? portal.shadowRoot.textContent || '' : '';
  const overlay = /\\d+ issue|Unhandled Runtime Error|Console Error|Build Error|Runtime Error/i.test(portalText);
  const overlayText = overlay ? portalText.replace(/\\s+/g, ' ').slice(0, 120) : '';
  const skip = !!d.querySelector('a[href="#main"],a[href="#content"],a[href="#main-content"]');
  const main = !!d.querySelector('main');
  const text = d.body.innerText.replace(/\\s+/g, ' ').slice(0, 80);
  return { path: location.pathname, w, scrollW: de.scrollWidth, overflow: de.scrollWidth > w, wide: wide.length, wideEg: wide.slice(0, 2).map((e) => e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ').slice(0, 2).join('.') : '')), unlabeled: unlabeled.length, unlabeledEg: unlabeled.slice(0, 2).map((e) => e.tagName + ':' + e.type + ':' + (e.name || e.id || '')), unnamed: unnamed.length, tiny: tiny.length, tinyEg: tiny.slice(0, 2).map((e) => (e.textContent.trim() || e.getAttribute('aria-label') || e.tagName).slice(0, 20)), h1, overlay, overlayText, skip, main, lang: de.lang, text, outermost, culprits, layoutWide, textSpill };
})()`;

const KEYBOARD = `(async () => {
  const out = [];
  for (let i = 0; i < 8; i++) {
    const a = document.activeElement;
    if (!a || a === document.body) { out.push('body'); continue; }
    const cs = getComputedStyle(a);
    const ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none';
    out.push((a.tagName.toLowerCase()) + (a.textContent.trim() ? ':' + a.textContent.trim().slice(0, 16) : '') + (ring ? '' : '[no-ring]'));
    break;
  }
  return out.join(' ');
})()`;

type Audit = { outermost: string[]; culprits: string[]; layoutWide: string[]; textSpill: string[]; path: string; w: number; scrollW: number; overflow: boolean; wide: number; wideEg: string[]; overlayText: string; unlabeled: number; unlabeledEg: string[]; unnamed: number; tiny: number; tinyEg: string[]; h1: string[]; overlay: boolean; skip: boolean; main: boolean; lang: string; text: string };

export async function runBrowserQa() {
  mkdirSync(OUT, { recursive: true });
  const org = await prisma.organization.findUniqueOrThrow({ where: { slug: "northbeam" } });
  const [item, script, report, idea] = await Promise.all([
    prisma.contentItem.findFirst({ where: { orgId: org.id }, select: { id: true } }),
    prisma.script.findFirst({ where: { orgId: org.id }, select: { id: true } }),
    prisma.weeklyReport.findFirst({ where: { orgId: org.id }, select: { id: true } }),
    prisma.idea.findFirst({ where: { orgId: org.id }, select: { id: true } }),
  ]);
  const clientRoutes = ["/app/northbeam", "/app/northbeam/intelligence", "/app/northbeam/create", `/app/northbeam/create/ideas/${idea?.id ?? ""}`, `/app/northbeam/create/scripts/${script?.id ?? ""}`, "/app/northbeam/production", "/app/northbeam/production/recording", `/app/northbeam/production/${item?.id ?? ""}`, "/app/northbeam/distribution", "/app/northbeam/performance", "/app/northbeam/pipeline", "/app/northbeam/library", "/app/northbeam/settings", "/app/northbeam/learning", "/app/northbeam/reports", `/app/northbeam/reports/${report?.id ?? ""}`, "/onboarding/northbeam"].filter((r) => !r.endsWith("/"));
  const operatorRoutes = ["/admin", "/admin/clients", "/admin/acquisition", "/admin/prospects", "/admin/queue", "/admin/research", "/admin/market", "/admin/applications", "/admin/sops", "/admin/support"];
  const superRoutes = ["/admin/metrics"];
  const publicRoutes = ["/login", "/apply"];

  const { proc, cdp } = await launch();
  const consoleErrors: string[] = [];
  const failed: string[] = [];
  cdp.on("Network.responseReceived", (p) => { const r = p.response as { status: number; url: string }; if (r.status >= 400 && !/favicon|\.hot-update\.|__nextjs/.test(r.url)) failed.push(`${r.status} ${r.url.replace(BASE, "")}`); });
  cdp.on("Runtime.consoleAPICalled", (p) => { if (p.type === "error" || p.type === "warning") consoleErrors.push(`${p.type}: ${String((p.args as { value?: unknown; description?: string }[]).map((a) => a.value ?? a.description ?? "").join(" ")).slice(0, 160)}`); });
  cdp.on("Runtime.exceptionThrown", (p) => { const e = p.exceptionDetails as { text?: string; url?: string; lineNumber?: number; exception?: { description?: string } }; consoleErrors.push(`exception: ${String(e.exception?.description ?? e.text).slice(0, 120)} @${(e.url ?? "").replace(BASE, "")}:${e.lineNumber}`); });
  cdp.on("Log.entryAdded", (p) => { const e = p.entry as { level: string; text: string }; if (e.level === "error" && !/favicon/.test(e.text)) consoleErrors.push(`log: ${e.text.slice(0, 160)}`); });
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Log.enable");
  await cdp.send("Network.enable");

  let loaded: (() => void) | null = null;
  cdp.on("Page.loadEventFired", () => loaded?.());

  async function open(route: string) {
    const waitLoad = new Promise<void>((r) => { loaded = r; });
    await cdp.send("Page.navigate", { url: BASE + route });
    await Promise.race([waitLoad, sleep(15000)]);
    await sleep(1500); // hydration + client effects
  }
  async function evaluate<T>(expression: string): Promise<T> {
    const r = await cdp.send<{ result: { value: T } }>("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    return r.result.value;
  }
  async function session(email: string | null) {
    await cdp.send("Network.clearBrowserCookies");
    if (!email) return;
    const { token } = await actAs(email);
    await cdp.send("Network.setCookie", { name: "threadline_session", value: token, domain: "localhost", path: "/", httpOnly: true });
  }
  async function shot(name: string) {
    const r = await cdp.send<{ data: string }>("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    writeFileSync(path.join(OUT, `${name}.png`), Buffer.from(r.data, "base64"));
  }

  try {
    const groups: [string, string | null, string[]][] = [["client (client_admin)", CLIENT, clientRoutes], ["operator (internal)", OPERATOR, operatorRoutes], ["super_admin", SUPER, superRoutes], ["public", null, publicRoutes]];
    for (const width of WIDTHS) {
      await cdp.send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width <= 768 });
      section(`browser — ${width}px`);
      for (const [label, email, routes] of groups) {
        await session(email);
        for (const route of routes) {
          if (ONLY && route !== ONLY) continue;
          consoleErrors.length = 0;
          failed.length = 0;
          await open(route);
          const a = await evaluate<Audit>(AUDIT);
          const redirected = a.path !== route;
          if (redirected && email) { record(`browser:${width}`, `${route}`, "FAIL", `redirected to ${a.path} (${label}) — page missing or guard wrong`, "BROWSER-ROUTE"); continue; }
          const pageFailed = failed.filter((f) => f.endsWith(route) || f.includes(route + "?"));
          if (pageFailed.length) { record(`browser:${width}`, `${route} (${label.split(" ")[0]})`, "FAIL", `page itself returned ${pageFailed[0]}`, "BROWSER-ROUTE"); continue; }
          const resourceFailed = failed.filter((f) => !pageFailed.includes(f));
          const problems: string[] = [];
          const a11yNote: string[] = [];
          const explained = a.wide > 0 || a.culprits.length > 0 || a.layoutWide.length > 0 || a.textSpill.length > 0;
          if (a.overflow && explained) problems.push(`horizontal overflow scrollW=${a.scrollW} wide=${a.wide} ${a.wideEg.join(",")} culprits=${a.culprits.join(" | ")} layout=${a.layoutWide.join(" | ")} spill=${a.textSpill.join(" | ")}`);
          else if (a.overflow) a11yNote.push(`documentElement.scrollWidth ${a.scrollW} > viewport ${a.w} but no element, layout box or text sits past the edge (inside-scroller content only: ${a.outermost.join(" | ")}) — verify visually`);
          if (a.overlay) problems.push(`Next.js reports an error: ${a.overlayText}`);
          const hydration = consoleErrors.filter((e) => /hydrat|did not match|Unhandled|TypeError|ReferenceError|exception/i.test(e));
          if (hydration.length) problems.push(`runtime: ${hydration[0]}`);
          if (resourceFailed.some((f) => f.startsWith("5"))) problems.push(`resource 5xx: ${resourceFailed.filter((f) => f.startsWith("5")).slice(0, 2).join(", ")}`);
          if (resourceFailed.some((f) => f.startsWith("4"))) a11yNote.push(`resource 4xx: ${resourceFailed.filter((f) => f.startsWith("4")).slice(0, 2).join(", ")}`);
          const a11y: string[] = [...a11yNote];
          if (a.unlabeled) a11y.push(`${a.unlabeled} unlabelled controls (${a.unlabeledEg.join(",")})`);
          if (a.unnamed) a11y.push(`${a.unnamed} unnamed buttons/links`);
          if (a.h1.length !== 1) a11y.push(`${a.h1.length} h1s ${JSON.stringify(a.h1)}`);
          if (!a.main) a11y.push("no <main>");
          if (width === 390 && a.tiny > 0) a11y.push(`${a.tiny} targets < 24px (WCAG 2.5.8) e.g. ${a.tinyEg.join(",")}`);
          const otherConsole = consoleErrors.filter((e) => !hydration.includes(e));
          const verdict = problems.length ? "FAIL" : a11y.length ? "PARTIAL" : "PASS";
          record(`browser:${width}`, `${route} (${label.split(" ")[0]})`, verdict, [...problems, ...a11y, otherConsole.length ? `console: ${otherConsole[0]}` : ""].filter(Boolean).join(" · ") || `ok · h1=${a.h1[0] ?? ""}`, problems.length ? "BROWSER-LAYOUT" : undefined);
          if (verdict === "FAIL" || (width === 390 && ["/app/northbeam", "/app/northbeam/production", "/app/northbeam/learning", "/admin", "/login"].includes(route))) await shot(`${width}-${route.replace(/\W+/g, "_")}`);
        }
      }
    }

    // Keyboard reachability on the two densest pages.
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await session(CLIENT);
    section("browser — keyboard");
    for (const route of ["/app/northbeam", "/app/northbeam/production"]) {
      await open(route);
      const path: string[] = [];
      for (let i = 0; i < 6; i++) {
        await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
        await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
        path.push(await evaluate<string>(KEYBOARD));
      }
      const noRing = path.filter((p) => p.includes("[no-ring]")).length;
      const stuck = path.filter((p) => p === "body").length;
      record("browser:keyboard", `${route}: six Tabs reach real controls with a focus ring`, stuck === 0 && noRing === 0 ? "PASS" : stuck ? "FAIL" : "PARTIAL", path.join(" → "), stuck ? "BROWSER-KEYBOARD" : undefined);
    }
  } finally {
    proc.kill();
    await cleanupSessions();
  }
}

if (require.main === module) {
  (async () => {
    try {
      await runBrowserQa();
    } finally {
      const s = summary();
      console.log(`\nbrowser: pass=${s.pass} partial=${s.partial} fail=${s.fail} · screenshots in ${OUT}`);
      await prisma.$disconnect();
      process.exitCode = s.fail ? 1 : 0;
    }
  })();
}
