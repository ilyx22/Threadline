import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectShape, handleFromUrl, parseUrlList } from "./corpus-enrich";

/**
 * The rules these tests protect:
 *
 *   1. a pasted block yields the links a person meant, in order, once each;
 *   2. platform and format are derived only where the URL genuinely says so —
 *      a wrong format silently moves a piece into the wrong baseline;
 *   3. a handle is null rather than wrong, because handles are the key creator
 *      baselines are grouped by and a typo splits one creator into two.
 */

describe("parsing a pasted block", () => {
  it("takes one URL per line", () => {
    const urls = parseUrlList(
      "https://example.com/a\nhttps://example.com/b\nhttps://example.com/c",
    );
    assert.deepEqual(urls, [
      "https://example.com/a",
      "https://example.com/b",
      "https://example.com/c",
    ]);
  });

  it("survives whatever shape the links arrive in", () => {
    // Comma-separated, wrapped in prose, indented, trailing punctuation. All of
    // these are things people actually paste.
    const urls = parseUrlList(`
      Worth looking at: https://example.com/one, and https://example.com/two.
        https://example.com/three
    `);
    assert.deepEqual(urls, [
      "https://example.com/one",
      "https://example.com/two",
      "https://example.com/three",
    ]);
  });

  it("collapses a link pasted twice in one go", () => {
    // Always an accident, never an instruction to store it twice.
    const urls = parseUrlList("https://example.com/a\nhttps://EXAMPLE.com/a\nhttps://example.com/b");
    assert.equal(urls.length, 2);
  });

  it("finds nothing in a block with no links", () => {
    assert.deepEqual(parseUrlList("just some notes about a post"), []);
  });

  it("ignores non-http schemes", () => {
    assert.deepEqual(parseUrlList("ftp://example.com/a file:///etc/passwd"), []);
  });
});

describe("reading the platform off a URL", () => {
  const shape = (u: string) => detectShape(new URL(u));

  it("separates YouTube Shorts from long-form", () => {
    // These do not share a baseline and guessing wrong moves a long video into
    // the short-form median.
    assert.deepEqual(shape("https://www.youtube.com/shorts/abc123"), {
      platform: "YouTube Shorts",
      format: "short_video",
    });
    assert.deepEqual(shape("https://www.youtube.com/watch?v=abc123"), {
      platform: "YouTube",
      format: "long_video",
    });
  });

  it("separates an Instagram reel from a carousel", () => {
    assert.equal(shape("https://www.instagram.com/reel/abc/").format, "short_video");
    assert.equal(shape("https://www.instagram.com/p/abc/").format, "carousel");
  });

  it("refuses to guess a LinkedIn format", () => {
    // A LinkedIn URL does not distinguish a text post from a native video.
    const linkedin = shape("https://www.linkedin.com/posts/someone_thing-activity-123");
    assert.equal(linkedin.platform, "LinkedIn");
    assert.equal(linkedin.format, "unknown");
  });

  it("recognises TikTok, X and Substack", () => {
    assert.equal(shape("https://www.tiktok.com/@someone/video/123").platform, "TikTok");
    assert.equal(shape("https://x.com/someone/status/123").platform, "X");
    assert.equal(shape("https://someone.substack.com/p/a-post").platform, "Substack");
  });

  it("falls back to Other without inventing a format", () => {
    assert.deepEqual(shape("https://some-consultancy.com/insights/a-post"), {
      platform: "Other",
      format: "unknown",
    });
  });
});

describe("reading the creator off a URL", () => {
  const handle = (u: string) => handleFromUrl(new URL(u));

  it("finds the handle where the URL carries one", () => {
    assert.equal(handle("https://www.tiktok.com/@someone/video/123"), "@someone");
    assert.equal(handle("https://x.com/Someone/status/123"), "@someone");
    assert.equal(handle("https://www.linkedin.com/in/Some-One/"), "@some-one");
    assert.equal(handle("https://someone.substack.com/p/a-post"), "@someone");
    assert.equal(handle("https://www.youtube.com/@someone/videos"), "@someone");
  });

  it("returns null rather than something wrong", () => {
    // A LinkedIn *post* URL does not contain the author's handle, only an
    // activity id. Guessing from it would split one creator into many.
    assert.equal(handle("https://www.linkedin.com/posts/activity-7123456789"), null);
    assert.equal(handle("https://www.youtube.com/watch?v=abc123"), null);
    assert.equal(handle("https://some-consultancy.com/insights/a-post"), null);
    assert.equal(handle("https://x.com/i/web/status/123"), null);
  });

  it("lower-cases handles so the same creator groups together", () => {
    assert.equal(handle("https://www.tiktok.com/@SomeOne/video/1"), "@someone");
    assert.equal(handle("https://www.tiktok.com/@someone/video/2"), "@someone");
  });
});
