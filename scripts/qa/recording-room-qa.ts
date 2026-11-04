/**
 * RECORDING ROOM — headless Chrome check of the four ways the founder uses it
 * (DR-52 / TODO_AUDIT D5): the ready list, the teleprompter (keyboard, scroll,
 * next/previous, reset, close), full screen, and print media. Real mouse and
 * key events over the DevTools protocol; a minted session, never a password.
 *
 *   node scripts/qa/run.cjs recording-room-qa      (QA_BASE, default :3000; seeded demo data)
 */
import path from "node:path";
import { launchChrome, open, setViewport, evaluate, sleep, type Cdp } from "./cdp";
import { actAs, cleanupSessions, record, section, summary } from "./context";

const BASE = (process.env.QA_BASE ?? "http://localhost:3000").replace(/\/$/, "");
const CLIENT = "alex@northbeamadvisory.com";
const URL = `${BASE}/app/northbeam/production/recording`;

async function click(cdp: Cdp, expr: string) {
  const pos = await evaluate<string>(cdp, `(() => { const e = ${expr}; if (!e) return 'null'; e.scrollIntoView({ block: 'center', behavior: 'instant' }); const r = e.getBoundingClientRect(); return JSON.stringify({ x: r.left + r.width / 2, y: r.top + r.height / 2 }); })()`);
  if (pos === "null") return false;
  const { x, y } = JSON.parse(pos);
  for (const type of ["mousePressed", "mouseReleased"]) await cdp.send("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: 1 });
  return true;
}
async function key(cdp: Cdp, k: string, code: string) {
  await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: k, code, text: k === " " ? " " : undefined });
  await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code });
  await sleep(250);
}
const counter = (cdp: Cdp) => evaluate<string>(cdp, `document.querySelector('[aria-label=Teleprompter] .text-eyebrow')?.textContent?.trim() ?? ''`);
const scrollTop = (cdp: Cdp) => evaluate<number>(cdp, `(() => { const d = document.querySelector('[aria-label=Teleprompter] .overflow-y-auto'); return d ? Math.round(d.scrollTop) : -1; })()`);
const isOpen = (cdp: Cdp) => evaluate<boolean>(cdp, `!!document.querySelector('[aria-label=Teleprompter]')`);
const openBtn = `[...document.querySelectorAll('button')].find(b => /Open teleprompter/.test(b.textContent))`;

(async () => {
  const b = await launchChrome({ port: 9352, profileDir: path.resolve("scripts/qa/.shots/recording-profile") });
  const { cdp } = b;
  try {
    const { token } = await actAs(CLIENT);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCookie", { name: "threadline_session", value: token, url: BASE, httpOnly: true, path: "/" });

    section("recording room — ready list (1440px)");
    await setViewport(cdp, 1440, 900, false);
    await open(cdp, URL, 2000);
    const list = await evaluate<string>(cdp, `JSON.stringify({ h1: document.querySelector('h1')?.textContent?.trim(), items: document.querySelectorAll('main ul > li').length, open: !!(${openBtn}), estimate: /Estimated recording time/.test(document.body.innerText) })`);
    const L = JSON.parse(list);
    record("recording", "ready list renders with pieces, an estimate and the teleprompter button", L.items > 0 && L.open && L.estimate ? "PASS" : "FAIL", list);

    section("recording room — teleprompter");
    await click(cdp, openBtn);
    await sleep(600);
    const c1 = await counter(cdp);
    const total = Number(c1.split("/")[1]?.trim() ?? 0);
    record("recording", "Open teleprompter opens a labelled dialog at piece 1", (await isOpen(cdp)) && c1.startsWith("1 /") ? "PASS" : "FAIL", `counter="${c1}"`);

    const s0 = await scrollTop(cdp);
    await key(cdp, " ", "Space");
    await sleep(2500);
    const s1 = await scrollTop(cdp);
    await key(cdp, " ", "Space");
    const s2 = await scrollTop(cdp);
    await sleep(1200);
    const s3 = await scrollTop(cdp);
    record("recording", "Space starts the scroll and Space pauses it", s1 > s0 && Math.abs(s3 - s2) <= 2 ? "PASS" : "FAIL", `start=${s0} after 2.5s=${s1} paused=${s2}→${s3}`);

    const before = await evaluate<string>(cdp, `localStorage.getItem('tl.teleprompter') ?? ''`);
    await key(cdp, "ArrowUp", "ArrowUp");
    await sleep(300);
    const after = await evaluate<string>(cdp, `localStorage.getItem('tl.teleprompter') ?? ''`);
    const speedOf = (s: string) => { try { return (JSON.parse(s) as { speedIndex?: number }).speedIndex ?? null; } catch { return null; } };
    record("recording", "ArrowUp raises the speed and the setting is remembered", (speedOf(after) ?? -1) > (speedOf(before) ?? 3) ? "PASS" : "FAIL", `before=${before || "(default)"} after=${after}`);

    await key(cdp, "r", "KeyR");
    await sleep(700);
    record("recording", "R resets to the top", (await scrollTop(cdp)) <= 2 ? "PASS" : "FAIL", `scrollTop=${await scrollTop(cdp)}`);

    if (total > 1) {
      await key(cdp, "ArrowRight", "ArrowRight");
      const c2 = await counter(cdp);
      await key(cdp, "ArrowLeft", "ArrowLeft");
      const c3 = await counter(cdp);
      record("recording", "ArrowRight / ArrowLeft move between pieces", c2.startsWith("2 /") && c3.startsWith("1 /") ? "PASS" : "FAIL", `${c1} → ${c2} → ${c3}`);
    } else {
      record("recording", "ArrowRight / ArrowLeft move between pieces", "NA", "only one ready piece in the seed");
    }

    section("recording room — full screen");
    await click(cdp, `document.querySelector('[aria-label="Toggle full screen"]')`);
    await sleep(800);
    const fsOn = await evaluate<string>(cdp, `document.fullscreenElement?.id ?? ''`);
    await click(cdp, `document.querySelector('[aria-label="Toggle full screen"]')`);
    await sleep(800);
    const fsOff = await evaluate<string>(cdp, `document.fullscreenElement?.id ?? ''`);
    record("recording", "Toggle full screen enters and leaves full screen on the teleprompter", fsOn === "teleprompter-root" && fsOff === "" ? "PASS" : "FAIL", `on=${fsOn || "none"} off=${fsOff || "none"}`);

    await key(cdp, "Escape", "Escape");
    await sleep(400);
    record("recording", "Escape closes the teleprompter", !(await isOpen(cdp)) ? "PASS" : "FAIL", "");

    section("recording room — phone (390px)");
    await setViewport(cdp, 390, 844, true);
    await open(cdp, URL, 2000);
    await click(cdp, openBtn);
    await sleep(600);
    const phone = await evaluate<string>(cdp, `(() => { const d = document.querySelector('[aria-label=Teleprompter]'); if (!d) return JSON.stringify({ open: false }); const vw = document.documentElement.clientWidth; const over = [...d.querySelectorAll('button')].filter(b => { const r = b.getBoundingClientRect(); return r.width > 0 && (r.right > vw + 1 || r.left < -1); }).map(b => b.getAttribute('aria-label') || b.textContent.trim()).slice(0, 5); const close = d.querySelector('[aria-label="Close teleprompter"]').getBoundingClientRect(); return JSON.stringify({ open: true, vw, over, closeVisible: close.right <= vw && close.top >= 0 }); })()`);
    const P = JSON.parse(phone);
    record("recording", "teleprompter fits a phone: every control on screen, close reachable", P.open && P.over.length === 0 && P.closeVisible ? "PASS" : "FAIL", phone);
    await click(cdp, `document.querySelector('[aria-label="Close teleprompter"]')`);
    await sleep(400);
    record("recording", "Close button closes it on a phone", !(await isOpen(cdp)) ? "PASS" : "PARTIAL", "");

    section("recording room — print media");
    await setViewport(cdp, 1024, 900, false);
    await open(cdp, URL, 2000);
    await cdp.send("Emulation.setEmulatedMedia", { media: "print" });
    await sleep(300);
    const print = await evaluate<string>(cdp, `(() => { const vis = (e) => !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0; const titles = [...document.querySelectorAll('main ul > li')].filter(vis).length; const nav = document.querySelector('aside, nav'); return JSON.stringify({ titles, navVisible: vis(nav), bodyBg: getComputedStyle(document.body).backgroundColor }); })()`);
    await cdp.send("Emulation.setEmulatedMedia", { media: "" });
    const PR = JSON.parse(print);
    record("recording", "printing the page keeps the ready list (no dedicated print layout; app navigation still prints)", PR.titles > 0 ? (PR.navVisible ? "PARTIAL" : "PASS") : "FAIL", print);
  } finally {
    b.close();
    await cleanupSessions();
  }
  const t = summary();
  console.log(`
recording: pass=${t.pass} partial=${t.partial} fail=${t.fail} n/a=${t.na}`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
