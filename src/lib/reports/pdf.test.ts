import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pdfText, renderPdf } from "./pdf";

describe("PDF writer (REP-03)", () => {
  it("produces a structurally valid PDF with a correct cross-reference table", () => {
    const blocks = [{ kind: "title" as const, text: "Report" }, ...Array.from({ length: 120 }, (_, i) => ({ kind: "p" as const, text: `Line ${i} with (brackets) and a backslash \\ and £ sign` }))];
    const pdf = renderPdf(blocks, { title: "Test" });
    const text = pdf.toString("latin1");
    assert.ok(text.startsWith("%PDF-1.4"));
    assert.ok(text.trimEnd().endsWith("%%EOF"));
    const pages = Number(/\/Count (\d+)/.exec(text)![1]);
    assert.ok(pages >= 3, "long content breaks across pages");
    // every xref offset points at the start of its object
    const xrefAt = Number(/startxref\n(\d+)/.exec(text)![1]);
    const entries = text.slice(xrefAt).split("\n").filter((l) => / 00000 n $/.test(l)).map((l) => Number(l.slice(0, 10)));
    entries.forEach((off, i) => assert.ok(text.slice(off).startsWith(`${i + 1} 0 obj`), `object ${i + 1} offset`));
  });

  it("escapes PDF string syntax and maps to WinAnsi", () => {
    assert.equal(pdfText("a(b)c\\"), "a\\(b\\)c\\\\");
    assert.equal(pdfText("£5 – ok"), "\\2435 - ok");
    assert.equal(pdfText("日本"), "??");
  });
});
