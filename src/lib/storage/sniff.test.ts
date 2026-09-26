import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { contentProblem, servingHeaders, sniff } from "./sniff";

const bytes = (...parts: (number[] | string)[]) =>
  new Uint8Array(parts.flatMap((p) => (typeof p === "string" ? [...p].map((c) => c.charCodeAt(0)) : p)));
const PNG = bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], [0, 0, 0, 13]);
const MP4 = bytes([0, 0, 0, 0x18], "ftypisom", [0, 0, 0, 0]);
const PDF = bytes("%PDF-1.7\n");

describe("upload content checks (SEC-02)", () => {
  it("identifies common families from their first bytes", () => {
    assert.equal(sniff(PNG), "png");
    assert.equal(sniff(MP4), "isobmff");
    assert.equal(sniff(PDF), "pdf");
    assert.equal(sniff(bytes("hello, world\n")), "text");
  });
  it("accepts a file whose bytes match its declared type", () => {
    assert.equal(contentProblem("image/png", PNG), null);
    assert.equal(contentProblem("video/mp4", MP4), null);
    assert.equal(contentProblem("text/csv", bytes("a,b\n1,2\n")), null);
  });
  it("rejects SVG and HTML whatever the bytes", () => {
    assert.match(contentProblem("image/svg+xml", bytes("<svg onload=alert(1)>")) ?? "", /SVG/);
    assert.ok(contentProblem("text/html", bytes("<p>")));
  });
  it("rejects HTML smuggled in as text or as an image", () => {
    assert.ok(contentProblem("text/plain", bytes("<!doctype html><script>x</script>")));
    assert.ok(contentProblem("image/png", bytes("<html><script>x</script>")));
    assert.ok(contentProblem("text/plain", bytes("<svg xmlns='http://www.w3.org/2000/svg'>")));
  });
  it("rejects a mismatched or unknown type", () => {
    assert.ok(contentProblem("image/png", PDF));
    assert.ok(contentProblem("application/x-msdownload", bytes("MZ")));
  });
});

describe("serving stored files (SEC-02)", () => {
  it("renders only raster images, video and audio inline", () => {
    assert.match(servingHeaders("image/png", "a.png", 1)["Content-Disposition"], /^inline/);
    assert.match(servingHeaders("video/mp4", "a.mp4", 1)["Content-Disposition"], /^inline/);
  });
  it("downloads everything else with a neutral type, including legacy SVG", () => {
    for (const t of ["image/svg+xml", "application/pdf", "text/html", null]) {
      const h = servingHeaders(t, "x", 1);
      assert.match(h["Content-Disposition"], /^attachment/);
      assert.equal(h["Content-Type"], "application/octet-stream");
    }
  });
  it("sandboxes every response and cannot be header-injected by the file name", () => {
    const h = servingHeaders("image/png", 'evil"\r\nSet-Cookie: x=1.png', 1);
    assert.match(h["Content-Security-Policy"], /sandbox/);
    assert.doesNotMatch(h["Content-Disposition"], /[\r\n]/);
  });
});
