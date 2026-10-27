import { test } from "node:test";
import assert from "node:assert/strict";
import { chunkDocument, toOrQuery } from "./chunk";

test("headings start sections and travel with their chunks", () => {
  const chunks = chunkDocument("Intro line.\n\n# Hooks\nUse a number.\n\nName the pain.\n\n## CTAs\nOne ask only.");
  assert.deepEqual(
    chunks.map((c) => [c.ordinal, c.heading, c.text]),
    [
      [0, null, "Intro line."],
      [1, "Hooks", "Use a number.\n\nName the pain."],
      [2, "CTAs", "One ask only."],
    ],
  );
});

test("long sections split on paragraphs, long paragraphs on sentences, nothing over the cap", () => {
  const para = "A sentence that is fairly long. ".repeat(20).trim();
  const chunks = chunkDocument(`# S\n${para}\n\n${para}\n\n${"x".repeat(250)}`, 200);
  assert.ok(chunks.length > 5);
  assert.ok(chunks.every((c) => c.text.length <= 200 && c.heading === "S"));
  assert.equal(chunks.map((c) => c.text).join("").replace(/\s/g, "").length, (para + para + "x".repeat(250)).replace(/\s/g, "").length);
});

test("empty body gives no chunks; CRLF is handled", () => {
  assert.deepEqual(chunkDocument("  \n\n "), []);
  assert.equal(chunkDocument("# A\r\nbody\r\n")[0].heading, "A");
});

test("toOrQuery keeps safe words only, drops stop words and duplicates", () => {
  assert.equal(toOrQuery("How to write the HOOK: hook's & 'drop table'; AI consultants!"), "write | hook | drop | table | ai | consultants");
  assert.equal(toOrQuery("a an to"), "");
});
