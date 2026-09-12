import { grid } from "@/content/marketing-site";
import Reveal from "./Reveal";

/**
 * The compact six-cell summary of the managed service — dense, scannable,
 * between the quiet market-memory panel and the night founder-burden band.
 * Data-driven: each cell is `{ figure, title, line, inverse?, evidence? }`;
 * when a verified client metric exists it replaces `figure` and `evidence`
 * carries its ledger id, with no change to the composition. Until then every
 * figure is a value statement, not a measurement.
 */
export default function ValueGrid() {
  return (
    <section id="system-summary" className="section-grid" aria-labelledby="system-summary-title">
      <div className="mk-container">
        <Reveal className="grid-head">
          <span className="eyebrow-serif">{grid.eyebrow}</span>
          <h2 id="system-summary-title" className="h3-28">
            {grid.headline}
          </h2>
        </Reveal>
        <Reveal as="ul" className="value-grid">
          {grid.cells.map((c, i) => (
            <li key={c.title} className={`obj value-cell${c.inverse ? " is-cobalt" : " is-paper"} assemble`} style={{ ["--i" as string]: i, ["--ay" as string]: "24px" }}>
              <span className="value-figure">{c.figure}</span>
              <span className="value-title">{c.title}</span>
              <span className="value-line">{c.line}</span>
              {c.evidence ? <span className="label value-evidence">{c.evidence}</span> : null}
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
