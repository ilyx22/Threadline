import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectMapping, normaliseUrl, parseCsv, toCandidates } from "./csv-import";

const CSV = '\uFEFFPost URL,Date,Impressions,Reactions,"Comments, total",Views\r\nhttps://www.linkedin.com/posts/abc/,2026-09-20,"1,204",33,4,900\r\n,2026-09-21,10,1,0,5\r\nhttps://youtu.be/x?si=track,2026-09-22,,,,\r\n';

describe("metrics CSV import (INT-05)", () => {
  it("parses quoted fields, commas inside quotes, BOM and CRLF", () => {
    const rows = parseCsv(CSV);
    assert.equal(rows.length, 4);
    assert.equal(rows[0][4], "Comments, total");
    assert.equal(rows[1][2], "1,204");
  });
  it("maps common platform headers and reports the rest", () => {
    const { mapping, ignored } = detectMapping(parseCsv(CSV)[0]);
    assert.deepEqual([mapping.url, mapping.date, mapping.impressions, mapping.likes, mapping.views], [0, 1, 2, 3, 5]);
    assert.deepEqual(ignored, ["Comments, total"]);
  });
  it("builds candidates with problems stated, and fingerprints rows for dedupe", () => {
    const rows = parseCsv(CSV);
    const c = toCandidates(rows, detectMapping(rows[0]).mapping);
    assert.deepEqual(c[0].metrics, { impressions: 1204, likes: 33, views: 900 });
    assert.match(c[1].problem ?? "", /No post URL/);
    assert.match(c[2].problem ?? "", /No metric values/);
    assert.equal(toCandidates(rows, detectMapping(rows[0]).mapping)[0].fingerprint, c[0].fingerprint);
  });
  it("matches URLs despite scheme, www, trailing slash and tracking query", () => {
    assert.equal(normaliseUrl("https://www.linkedin.com/posts/abc/"), normaliseUrl("http://linkedin.com/posts/abc?utm=x"));
  });
});
