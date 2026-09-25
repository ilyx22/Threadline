import * as React from "react";

/**
 * The fit, as one table: a good fit on the left, not a fit on the right, one
 * pair per row. Shared by the homepage and Who it is for. `tinted` gives the
 * two columns the sky and peach grounds used on Who it is for.
 */
type Column = { readonly label: string; readonly items: readonly string[] };

export function FitTable({ good, bad, tinted = false }: { good: Column; bad: Column; tinted?: boolean }) {
  const rows = Math.max(good.items.length, bad.items.length);
  return (
    <div className={`v9-fit-table-wrap v9-reveal${tinted ? " is-tinted" : ""}`}>
      <table className="v9-fit-table">
        <thead>
          <tr>
            <th scope="col" className="is-good">
              <span className="v9-fit-mark is-good" aria-hidden="true" />
              {good.label}
            </th>
            <th scope="col" className="is-bad">
              <span className="v9-fit-mark is-bad" aria-hidden="true" />
              {bad.label}
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              <td className="is-good">{good.items[i] ?? ""}</td>
              <td className="is-bad">{bad.items[i] ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
