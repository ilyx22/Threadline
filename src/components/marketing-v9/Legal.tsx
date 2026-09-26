import * as React from "react";
import type { LegalDoc } from "@/content/legal";
import { WordmarkMarquee } from "./Marquee";

/** A legal page in the site's system: one white panel, a serif title, plain prose, tables where a table says it better. */
export function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <div className="v9-home ap-page legal-page">
      <section className="v9-hero" aria-labelledby="legal-title">
        <div className="v9-panel ap-panel is-single">
          <header className="ap-head">
            <p className="v9-eyebrow">Fine print</p>
            <h1 id="legal-title" className="v9-h1">
              {doc.title}
            </h1>
            <p className="v9-lead">{doc.lead}</p>
            <p className="v9-tag legal-updated">Last updated {doc.updated}</p>
          </header>
          <div className="legal-prose">
            {doc.sections.map((s) => (
              <section key={s.title} className="legal-section">
                <h2 className="v9-h3">{s.title}</h2>
                {s.paras?.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                {s.items ? (
                  <ul>
                    {s.items.map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ul>
                ) : null}
                {s.table ? (
                  <div className="legal-table-wrap">
                    <table className="legal-table">
                      <thead>
                        <tr>
                          {s.table[0].map((h) => (
                            <th key={h} scope="col">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {s.table.slice(1).map((row) => (
                          <tr key={row[0]}>
                            {row.map((cell, i) => (
                              <td key={i}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </section>
            ))}
          </div>
        </div>
      </section>
      <WordmarkMarquee />
    </div>
  );
}
