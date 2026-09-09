/**
 * The honest comparison — Threadline mutation of the frozen clone
 * `reference-analysis/clones/starborn-comparison-table` (see its FROZEN.md).
 * Kept: 1100px container, 1.4fr + four equal columns, the accent pip over the
 * own column, 73px hairline rows, the check / cross / italic-word vocabulary,
 * the five-column grid at phone widths. Changed: palette, type, the Threadline
 * column first, thirteen capability dimensions, no prices, no time-to-result.
 */
type Row = { label: string; threadline: string; ghost: string; agency: string; inhouse: string };
type Col = { key: keyof Omit<Row, "label">; label: string; sub: string };

const YES = new Set(["core", "built in", "first class", "yes", "when useful"]);
const NO = new Set(["no"]);

function Cell({ value, own }: { value: string; own?: boolean }) {
  const yes = YES.has(value);
  const no = NO.has(value);
  return (
    <div className={`tl-compare-col tl-compare-cell${own ? " is-own" : ""}`}>
      {yes ? (
        <span className={own ? "" : "is-yes"}>
          <span aria-hidden>✓ </span>
          {value}
        </span>
      ) : no ? (
        <span className="is-no">
          <span aria-hidden>✕</span>
          <span className="sr-only">no</span>
        </span>
      ) : (
        value
      )}
    </div>
  );
}

export function Comparison({ columns, rows, note }: { columns: readonly Col[]; rows: readonly Row[]; note: string }) {
  return (
    <div className="tl-compare" role="table" aria-label="How Threadline compares with a ghostwriter, a content agency and an in-house hire">
      <div className="tl-compare-row tl-compare-head" role="row">
        <div role="columnheader" className="sr-only">
          Dimension
        </div>
        {columns.map((c, i) => (
          <div key={c.key} role="columnheader" className={`tl-compare-col${i === 0 ? " tl-compare-own" : ""}`}>
            {i === 0 ? <span className="tl-compare-pip" aria-hidden /> : null}
            <div className="tl-compare-name">{c.label}</div>
            <div className="tl-compare-sub">{c.sub}</div>
          </div>
        ))}
      </div>
      <div>
        {rows.map((r) => (
          <div key={r.label} className="tl-compare-row tl-compare-body" role="row">
            <div role="rowheader" className="tl-compare-label">
              {r.label}
            </div>
            {columns.map((c, i) => (
              <div key={c.key} role="cell">
                <Cell value={r[c.key]} own={i === 0} />
              </div>
            ))}
          </div>
        ))}
      </div>
      <p className="tl-compare-note">{note}</p>
    </div>
  );
}
