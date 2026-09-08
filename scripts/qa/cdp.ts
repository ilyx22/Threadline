/**
 * Minimal Chrome DevTools Protocol client on Node's built-in WebSocket.
 * No dependencies. Shared by the browser QA sweep, the public-site QA suite,
 * the visual baseline capture and the reference-analysis tooling.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

export const CHROME = [
  process.env.CHROME_PATH ?? "",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].find((p) => p && existsSync(p));

export class Cdp {
  private id = 0;
  private pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
  private listeners = new Map<string, ((p: Record<string, unknown>) => void)[]>();
  constructor(private ws: WebSocket) {
    ws.addEventListener("message", (ev) => {
      const m = JSON.parse(String(ev.data));
      if (m.id && this.pending.has(m.id)) {
        const p = this.pending.get(m.id)!;
        this.pending.delete(m.id);
        if (m.error) p.reject(new Error(m.error.message));
        else p.resolve(m.result);
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
  off(method: string) {
    this.listeners.delete(method);
  }
  close() {
    this.ws.close();
  }
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type Browser = { proc: ChildProcess; cdp: Cdp; close: () => void };

/** Launch headless Chrome with a throwaway profile and attach to its first page. */
export async function launchChrome(opts: { port?: number; profileDir: string; extraArgs?: string[] } = { profileDir: ".chrome-profile" }): Promise<Browser> {
  if (!CHROME) throw new Error("Chrome not found — set CHROME_PATH");
  const port = opts.port ?? 9333;
  const profile = path.resolve(opts.profileDir);
  mkdirSync(profile, { recursive: true });
  const proc = spawn(
    CHROME,
    [
      "--headless=new",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-gpu",
      "--hide-scrollbars",
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
      ...(opts.extraArgs ?? []),
      "about:blank",
    ],
    { stdio: "ignore" },
  );
  let target: { webSocketDebuggerUrl: string } | undefined;
  for (let i = 0; i < 75 && !target; i++) {
    await sleep(200);
    try {
      const list = (await (await fetch(`http://localhost:${port}/json/list`)).json()) as { type: string; webSocketDebuggerUrl: string }[];
      target = list.find((t) => t.type === "page");
    } catch {
      /* not up yet */
    }
  }
  if (!target) {
    proc.kill();
    throw new Error("Chrome did not expose a page target");
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise<void>((res, rej) => {
    ws.addEventListener("open", () => res());
    ws.addEventListener("error", () => rej(new Error("CDP websocket error")));
  });
  const cdp = new Cdp(ws);
  return { proc, cdp, close: () => { try { cdp.close(); } catch { /* closed */ } proc.kill(); } };
}

/** Evaluate an expression in the page, returning its value (promises awaited). */
export async function evaluate<T>(cdp: Cdp, expression: string): Promise<T> {
  const r = await cdp.send<{ result: { value: T }; exceptionDetails?: { text: string; exception?: { description?: string } } }>("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
  return r.result.value;
}

/** Navigate and wait for the load event (with a ceiling), then a settle delay. */
export async function open(cdp: Cdp, url: string, settleMs = 1200, ceilingMs = 20000) {
  let done: (() => void) | null = null;
  const loaded = new Promise<void>((r) => { done = r; });
  cdp.on("Page.loadEventFired", () => done?.());
  await cdp.send("Page.navigate", { url });
  await Promise.race([loaded, sleep(ceilingMs)]);
  cdp.off("Page.loadEventFired");
  await sleep(settleMs);
}

/**
 * Frame-accurate scroll through the whole document so IntersectionObserver /
 * scroll-linked reveals fire, then return to the top. Reports the scroll
 * height and the number of frames stepped.
 */
export async function scrollThrough(cdp: Cdp, stepPx = 240): Promise<{ height: number; frames: number }> {
  return evaluate(cdp, `(async () => {
    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    const raf = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    let y = 0, frames = 0;
    const height = () => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    while (y < height()) { y += ${stepPx}; window.scrollTo(0, y); await raf(); frames++; if (frames > 2000) break; }
    await new Promise((r) => setTimeout(r, 400));
    window.scrollTo(0, 0); await raf();
    document.documentElement.style.scrollBehavior = prev;
    return { height: height(), frames };
  })()`);
}

export async function setViewport(cdp: Cdp, width: number, height = 900, mobile = width <= 768) {
  await cdp.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
}

export async function screenshot(cdp: Cdp, opts: { fullPage?: boolean; format?: "png" | "jpeg"; quality?: number } = {}): Promise<Buffer> {
  const params: Record<string, unknown> = { format: opts.format ?? "png", captureBeyondViewport: !!opts.fullPage };
  if (opts.format === "jpeg") params.quality = opts.quality ?? 72;
  if (opts.fullPage) {
    const { contentSize } = await cdp.send<{ contentSize: { width: number; height: number } }>("Page.getLayoutMetrics");
    params.clip = { x: 0, y: 0, width: contentSize.width, height: Math.min(contentSize.height, 16000), scale: 1 };
  }
  const r = await cdp.send<{ data: string }>("Page.captureScreenshot", params);
  return Buffer.from(r.data, "base64");
}
