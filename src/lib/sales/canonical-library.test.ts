import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { blocksFromVerbatimLibrary } from "./canonical-import";

const SOP = readFileSync("Threadline Final Working Resources/02 SOPs/SOP_03_DIAGNOSIS_SALES_CALL_V14.md", "utf8");
const LIBRARY = readFileSync("docs/launch-pack/sales/APPROVED_VERBATIM_LIBRARY.md", "utf8");

describe("approved verbatim library import", () => {
  const blocks = blocksFromVerbatimLibrary(SOP);

  it("imports all thirteen lettered passages", () => {
    assert.equal(blocks.length, 13);
    assert.deepEqual(blocks.map((b) => b.key.slice(8, 9)), "abcdefghijklm".split(""));
  });

  it("keeps every quoted passage character-for-character", () => {
    const quotes = LIBRARY.split("\n").filter((l) => l.startsWith("“"));
    assert.ok(quotes.length >= 15);
    const all = blocks.map((b) => b.exactText).join("\n");
    for (const q of quotes) assert.ok(all.includes(q), q.slice(0, 60));
  });
});
