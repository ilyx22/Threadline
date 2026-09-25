"use client";

import * as React from "react";
import { ENCOUNTERS, EVIDENCE, EVIDENCE_NOTE, EXPECTATION, ROOMS, ROUTE_RULE, SENTENCE, SORT_CARDS } from "@/content/playbook";

/**
 * The things a reader does inside the Playbook. Each widget is a small,
 * self-contained object: tap a card, sort a deck, build a sentence, open a
 * drawer, pick the rooms, scrub the encounters, read the evidence ladder,
 * write an expectation. Every widget renders its full content in the HTML,
 * works with a keyboard, and needs no explanation to read with scripting off.
 */

/* ------------------------------------------------------------ flip cards */
export function FlipGrid({ items, hint }: { items: readonly { front: string; back: string }[]; hint: string }) {
  const [open, setOpen] = React.useState<number[]>([]);
  const toggle = (i: number) => setOpen((o) => (o.includes(i) ? o.filter((x) => x !== i) : [...o, i]));
  return (
    <div className="pb-widget">
      <p className="pb-hint">
        {hint} <span className="pb-count">{open.length} / {items.length}</span>
      </p>
      <ul className="pb-flips">
        {items.map((it, i) => {
          const on = open.includes(i);
          return (
            <li key={it.front}>
              <button type="button" className={`pb-flip${on ? " is-open" : ""}`} aria-pressed={on} onClick={() => toggle(i)}>
                <span className="pb-flip-front">
                  <span className="v9-tag">{String(i + 1).padStart(2, "0")}</span>
                  <strong>{it.front}</strong>
                </span>
                <span className="pb-flip-back">{it.back}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------ sentence builder */
export function SentenceBuilder() {
  const [who, setWho] = React.useState("");
  const [what, setWhat] = React.useState("");
  const [how, setHow] = React.useState("");
  const filled = who.trim() && what.trim() && how.trim();
  const listy = /,| and | or /.test(`${who} ${what} ${how}`.replace(/ and never/g, ""));
  const verdict = !filled ? SENTENCE.verdicts.empty : listy ? SENTENCE.verdicts.list : SENTENCE.verdicts.decided;
  const Field = ({ id, value, set, list, placeholder }: { id: string; value: string; set: (v: string) => void; list: readonly string[]; placeholder: string }) => (
    <span className="pb-blank">
      <input id={id} list={`${id}-list`} value={value} onChange={(e) => set(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
      <datalist id={`${id}-list`}>
        {list.map((l) => (
          <option key={l} value={l} />
        ))}
      </datalist>
    </span>
  );
  return (
    <div className="pb-widget">
      <p className="pb-hint">Fill the three blanks. Pick a suggestion or write your own.</p>
      <p className="pb-sentence">
        <span>{SENTENCE.frame[0]}</span>
        <Field id="pb-who" value={who} set={setWho} list={SENTENCE.buyers} placeholder="a specific buyer" />
        <span>{SENTENCE.frame[1]}</span>
        <Field id="pb-what" value={what} set={setWhat} list={SENTENCE.problems} placeholder="an expensive problem" />
        <span>{SENTENCE.frame[2]}</span>
        <Field id="pb-how" value={how} set={setHow} list={SENTENCE.mechanisms} placeholder="a mechanism they do not have" />
        <span>.</span>
      </p>
      <p className={`pb-verdict${filled ? (listy ? " is-no" : " is-yes") : ""}`} aria-live="polite">
        {verdict}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------- drawers */
export function Drawers({ items, hint }: { items: readonly { title: string; body: string }[]; hint: string }) {
  const [open, setOpen] = React.useState<number[]>([]);
  return (
    <div className="pb-widget">
      <p className="pb-hint">
        {hint} <span className="pb-count">{open.length} / {items.length}</span>
      </p>
      <div className="pb-drawers">
        {items.map((it, i) => (
          <details
            key={it.title}
            className="pb-drawer"
            onToggle={(e) => {
              const isOpen = (e.currentTarget as HTMLDetailsElement).open;
              setOpen((o) => (isOpen ? (o.includes(i) ? o : [...o, i]) : o.filter((x) => x !== i)));
            }}
          >
            <summary>
              <span className="v9-tag">{String(i + 1).padStart(2, "0")}</span>
              <strong>{it.title}</strong>
              <i aria-hidden="true">+</i>
            </summary>
            <p>{it.body}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- sorter */
export function Sorter() {
  const [i, setI] = React.useState(0);
  const [pick, setPick] = React.useState<"topic" | "thesis" | null>(null);
  const [score, setScore] = React.useState(0);
  const done = i >= SORT_CARDS.length;
  const card = SORT_CARDS[Math.min(i, SORT_CARDS.length - 1)];
  const choose = (k: "topic" | "thesis") => {
    if (pick) return;
    setPick(k);
    if (k === card.kind) setScore((s) => s + 1);
  };
  const next = () => {
    setPick(null);
    setI((n) => n + 1);
  };
  const restart = () => {
    setI(0);
    setPick(null);
    setScore(0);
  };
  return (
    <div className="pb-widget">
      <p className="pb-hint">
        Thesis or topic? Sort the deck. <span className="pb-count">{Math.min(i + 1, SORT_CARDS.length)} / {SORT_CARDS.length}</span>
      </p>
      {done ? (
        <div className="pb-card pb-card-done">
          <p className="v9-tag">Deck sorted</p>
          <p className="pb-card-text">
            {score} of {SORT_CARDS.length} right. A thesis is something a buyer could disagree with; a topic is a subject nobody can react to.
          </p>
          <button type="button" className="v9-btn is-ghost" onClick={restart}>
            Sort again
          </button>
        </div>
      ) : (
        <div className={`pb-card${pick ? (pick === card.kind ? " is-yes" : " is-no") : ""}`}>
          <p className="v9-tag">Card {i + 1}</p>
          <p className="pb-card-text">{card.text}</p>
          <div className="pb-card-actions" role="group" aria-label="Sort this card">
            <button type="button" className={`v9-btn is-ghost${pick === "topic" ? " is-picked" : ""}`} onClick={() => choose("topic")} disabled={!!pick}>
              Topic
            </button>
            <button type="button" className={`v9-btn is-ghost${pick === "thesis" ? " is-picked" : ""}`} onClick={() => choose("thesis")} disabled={!!pick}>
              Thesis
            </button>
          </div>
          {pick ? (
            <div className="pb-card-feedback" aria-live="polite">
              <p>
                <strong>{pick === card.kind ? "Right." : "Not quite."}</strong> It is a {card.kind}. {card.why}
              </p>
              <button type="button" className="v9-btn" onClick={next}>
                {i + 1 < SORT_CARDS.length ? "Next card" : "Finish"}
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- rooms */
export function RoomPicker() {
  const [rooms, setRooms] = React.useState<string[]>([]);
  const [link, setLink] = React.useState(false);
  const [cta, setCta] = React.useState(false);
  const toggle = (r: string) => setRooms((s) => (s.includes(r) ? s.filter((x) => x !== r) : s.length < 2 ? [...s, r] : s));
  const verdict = link && cta ? ROUTE_RULE.observable : link || cta ? ROUTE_RULE.half : ROUTE_RULE.blind;
  return (
    <div className="pb-widget">
      <p className="pb-hint">
        Pick the two rooms your buyer is actually in. <span className="pb-count">{rooms.length} / 2</span>
      </p>
      <div className="pb-chips" role="group" aria-label="Rooms">
        {ROOMS.map((r) => {
          const on = rooms.includes(r);
          return (
            <button key={r} type="button" className={`pb-chip${on ? " is-on" : ""}`} aria-pressed={on} onClick={() => toggle(r)} disabled={!on && rooms.length >= 2}>
              {r}
            </button>
          );
        })}
      </div>
      <div className="pb-switches">
        <label className="pb-switch">
          <input type="checkbox" checked={link} onChange={(e) => setLink(e.target.checked)} />
          <span>A link Threadline can measure</span>
        </label>
        <label className="pb-switch">
          <input type="checkbox" checked={cta} onChange={(e) => setCta(e.target.checked)} />
          <span>A way for the buyer to get in touch</span>
        </label>
      </div>
      <p className={`pb-verdict${link && cta ? " is-yes" : link || cta ? "" : " is-no"}`} aria-live="polite">
        {verdict}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------ scrubber */
export function MemoryScrubber() {
  const [n, setN] = React.useState(0);
  const e = ENCOUNTERS[n];
  return (
    <div className="pb-widget">
      <p className="pb-hint">Drag through five ordinary encounters with one buyer.</p>
      <ol className="pb-encounters" aria-hidden="true">
        {ENCOUNTERS.map((x, i) => (
          <li key={x.state} className={i <= n ? "is-lit" : undefined}>
            <span className="pb-encounter-dot" />
            <span className="pb-encounter-piece">{x.piece}</span>
          </li>
        ))}
      </ol>
      <label className="pb-range">
        <span className="v9-tag">Encounter {n + 1} of 5</span>
        <input type="range" min={0} max={4} value={n} onChange={(ev) => setN(Number(ev.target.value))} aria-valuetext={`${e.state}: ${e.piece}`} />
      </label>
      <div className="pb-scrub-read" aria-live="polite">
        <p className="pb-scrub-state">{e.state}</p>
        <p>{e.note}</p>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- ladder */
export function EvidenceLadder() {
  const [sum, setSum] = React.useState(false);
  const total = EVIDENCE.length;
  return (
    <div className="pb-widget">
      <p className="pb-hint">Five classes of evidence, strongest first. Then try adding them up.</p>
      <ol className={`pb-ladder${sum ? " is-summed" : ""}`}>
        {EVIDENCE.map((ev, i) => (
          <li key={ev.name} style={{ ["--w" as string]: `${sum ? 100 : ev.strength}%` }}>
            <span className="v9-tag">{String(i + 1).padStart(2, "0")}</span>
            <span className="pb-ladder-name">{ev.name}</span>
            <span className="pb-ladder-bar" aria-hidden="true">
              <i />
            </span>
            <span className="pb-ladder-eg">{ev.example}</span>
          </li>
        ))}
      </ol>
      <label className="pb-switch">
        <input type="checkbox" checked={sum} onChange={(e) => setSum(e.target.checked)} />
        <span>Add them into one number</span>
      </label>
      <p className={`pb-verdict${sum ? " is-no" : ""}`} aria-live="polite">
        {sum ? `${total} signals, one number, and no way to tell which were real. ${EVIDENCE_NOTE}` : "Each signal keeps its class. The report can be read honestly."}
      </p>
    </div>
  );
}

/* ---------------------------------------------------------- expectation */
export function ExpectationCard() {
  const [piece, setPiece] = React.useState("");
  const [measure, setMeasure] = React.useState<string>(EXPECTATION.measures[0]);
  const [band, setBand] = React.useState(3);
  const [reason, setReason] = React.useState<string>(EXPECTATION.reasons[0]);
  /* the read date is the reader's, so it is set after mount: the server (UTC) and a phone near midnight disagree on the day, which showed as a hydration error on the live site */
  const [due, setDue] = React.useState("");
  React.useEffect(() => {
    setDue(new Date(Date.now() + 14 * 86400000).toLocaleDateString("en-GB", { day: "numeric", month: "long" }));
  }, []);
  return (
    <div className="pb-widget pb-expect">
      <p className="pb-hint">Write the card before the piece goes out.</p>
      <div className="pb-expect-form">
        <label>
          <span className="v9-tag">The piece</span>
          <input value={piece} onChange={(e) => setPiece(e.target.value)} placeholder="One line about what it argues" />
        </label>
        <label>
          <span className="v9-tag">I expect</span>
          <select value={measure} onChange={(e) => setMeasure(e.target.value)}>
            {EXPECTATION.measures.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="pb-range">
          <span className="v9-tag">About {band === 0 ? "none" : band === 1 ? "one" : band === 2 ? "a few" : band === 3 ? "several" : band === 4 ? "many" : "a lot"}</span>
          <input type="range" min={0} max={5} value={band} onChange={(e) => setBand(Number(e.target.value))} aria-label="Rough band" />
        </label>
        <label>
          <span className="v9-tag">Because</span>
          <select value={reason} onChange={(e) => setReason(e.target.value)}>
            {EXPECTATION.reasons.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="pb-expect-card" aria-live="polite">
        <span className="v9-tag">Expectation card</span>
        <p>
          <strong>{piece.trim() || "This piece"}</strong> should earn {band === 0 ? "no" : band === 1 ? "one" : band === 2 ? "a few" : band === 3 ? "several" : band === 4 ? "many" : "a lot of"} {measure}, because {reason}.
        </p>
        <span className="pb-stamp">{due ? `Read on ${due}` : "Read in 14 days"}</span>
      </div>
      <p className="v9-note">{EXPECTATION.note}</p>
    </div>
  );
}
