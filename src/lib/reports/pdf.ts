/**
 * A minimal, dependency-free PDF writer for text documents (REP-03).
 *
 * Reports are text and figures, so a PDF needs only the standard Helvetica
 * fonts, line wrapping and page breaks. Writing it here avoids adding a
 * third-party rendering dependency to the server. Text is encoded as
 * WinAnsi; characters outside it are replaced with "?" rather than dropped,
 * so nothing silently disappears.
 */
export type Block = { kind: "title" | "h2" | "p" | "small" | "rule"; text?: string };

const PAGE_W = 595.28; // A4 in points
const PAGE_H = 841.89;
const MARGIN = 56;
const STYLE = {
  title: { font: "F2", size: 20, lead: 26, before: 0, after: 10 },
  h2: { font: "F2", size: 13, lead: 18, before: 14, after: 4 },
  p: { font: "F1", size: 10.5, lead: 15, before: 0, after: 6 },
  small: { font: "F1", size: 8.5, lead: 12, before: 0, after: 4 },
} as const;

/** Helvetica advance widths (per 1000 em) for printable ASCII 32-126. */
const WIDTHS = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
];
const charWidth = (c: string, bold: boolean) => {
  const code = c.charCodeAt(0);
  const w = code >= 32 && code <= 126 ? WIDTHS[code - 32] : 556;
  return bold ? w * 1.05 : w;
};
const textWidth = (s: string, size: number, bold: boolean) => ([...s].reduce((a, c) => a + charWidth(c, bold), 0) * size) / 1000;

/** WinAnsi-safe text for a PDF string literal. */
export function pdfText(s: string) {
  const map: Record<string, string> = { "‘": "'", "’": "'", "“": '"', "”": '"', "–": "-", "—": "-", "…": "...", " ": " ", "•": "-", "→": "->", "£": "\\243", "€": "\\200" };
  return [...s]
    .map((c) => {
      if (map[c]) return map[c];
      if (c === "\\" || c === "(" || c === ")") return `\\${c}`;
      const code = c.charCodeAt(0);
      if (code < 32) return " ";
      if (code > 126 && code < 256) return `\\${code.toString(8).padStart(3, "0")}`;
      return code > 255 ? "?" : c;
    })
    .join("");
}

function wrap(text: string, size: number, bold: boolean, width: number) {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (textWidth(next, size, bold) <= width || !line) line = next;
      else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}

export function renderPdf(blocks: Block[], meta: { title: string; footer?: string }) {
  const pages: string[] = [];
  let ops: string[] = [];
  let y = PAGE_H - MARGIN;
  const width = PAGE_W - 2 * MARGIN;
  const newPage = () => {
    if (ops.length) pages.push(ops.join("\n"));
    ops = [];
    y = PAGE_H - MARGIN;
  };
  for (const b of blocks) {
    if (b.kind === "rule") {
      if (y - 10 < MARGIN) newPage();
      ops.push(`0.8 G ${MARGIN} ${(y - 4).toFixed(2)} m ${PAGE_W - MARGIN} ${(y - 4).toFixed(2)} l S 0 G`);
      y -= 12;
      continue;
    }
    const st = STYLE[b.kind];
    const bold = st.font === "F2";
    y -= st.before;
    for (const line of wrap(b.text ?? "", st.size, bold, width)) {
      if (y - st.lead < MARGIN + 20) newPage();
      y -= st.lead;
      ops.push(`BT /${st.font} ${st.size} Tf ${MARGIN} ${y.toFixed(2)} Td (${pdfText(line)}) Tj ET`);
    }
    y -= st.after;
  }
  newPage();

  const objects: string[] = [];
  const add = (body: string) => objects.push(body) - 1 + 1; // 1-based object numbers
  const catalog = add("<< /Type /Catalog /Pages 2 0 R >>");
  add("PAGES_PLACEHOLDER");
  const f1 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  const f2 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  const kids: number[] = [];
  pages.forEach((content, i) => {
    const footer = `BT /F1 8 Tf ${MARGIN} 30 Td (${pdfText(`${meta.footer ?? meta.title} - page ${i + 1} of ${pages.length}`)}) Tj ET`;
    const stream = `${content}\n${footer}`;
    const c = add(`<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`);
    kids.push(add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${c} 0 R >>`));
  });
  objects[1] = `<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(" ")}] /Count ${kids.length} >>`;
  const info = add(`<< /Title (${pdfText(meta.title)}) /Producer (Threadline) >>`);

  let out = "%PDF-1.4\n%\xe2\xe3\xcf\xd3\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(out, "latin1"));
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = Buffer.byteLength(out, "latin1");
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, "latin1");
}
