import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractReadable, fetchPublicPage, isPrivateAddress } from "./fetch-url";

/**
 * The URL reader is the only place in the product that makes a server-side
 * request to an address a user supplied, so it is the only place a
 * server-side request forgery is possible. These tests guard that boundary.
 */

describe("private address detection", () => {
  it("rejects loopback, private and link-local IPv4", () => {
    for (const address of [
      "127.0.0.1",
      "127.1.2.3",
      "10.0.0.1",
      "10.255.255.255",
      "172.16.0.1",
      "172.31.255.255",
      "192.168.1.1",
      "169.254.169.254", // cloud instance metadata
      "0.0.0.0",
      "100.64.0.1", // carrier-grade NAT
      "224.0.0.1", // multicast
    ]) {
      assert.equal(isPrivateAddress(address), true, `${address} should be rejected`);
    }
  });

  it("allows genuinely public IPv4", () => {
    for (const address of ["8.8.8.8", "1.1.1.1", "93.184.216.34", "172.32.0.1", "172.15.0.1"]) {
      assert.equal(isPrivateAddress(address), false, `${address} should be allowed`);
    }
  });

  it("rejects loopback and unique-local IPv6", () => {
    for (const address of ["::1", "::", "fe80::1", "fc00::1", "fd12:3456::1"]) {
      assert.equal(isPrivateAddress(address), true, `${address} should be rejected`);
    }
  });

  it("judges IPv4-mapped IPv6 on the embedded address", () => {
    assert.equal(isPrivateAddress("::ffff:127.0.0.1"), true);
    assert.equal(isPrivateAddress("::ffff:169.254.169.254"), true);
    assert.equal(isPrivateAddress("::ffff:8.8.8.8"), false);
  });

  it("rejects anything that is not an IP address at all", () => {
    assert.equal(isPrivateAddress("not-an-ip"), true);
    assert.equal(isPrivateAddress(""), true);
    assert.equal(isPrivateAddress("999.999.999.999"), true);
  });
});

describe("fetch guards", () => {
  it("refuses a non-http protocol", async () => {
    for (const url of ["file:///etc/passwd", "ftp://example.com", "gopher://example.com"]) {
      const result = await fetchPublicPage(url);
      assert.equal(result.ok, false);
      if (!result.ok) assert.equal(result.blocked, true);
    }
  });

  it("refuses an unparseable URL", async () => {
    const result = await fetchPublicPage("not a url at all");
    assert.equal(result.ok, false);
  });

  it("refuses localhost by name", async () => {
    const result = await fetchPublicPage("http://localhost:3000/admin");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.blocked, true);
      assert.match(result.reason, /internal/i);
    }
  });

  it("refuses a literal private address without making a request", async () => {
    const result = await fetchPublicPage("http://169.254.169.254/latest/meta-data/");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.blocked, true);
      assert.match(result.reason, /private network/i);
    }
  });

  it("EXPLAINS a login wall instead of pretending to read it", async () => {
    const result = await fetchPublicPage("https://www.linkedin.com/posts/example");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.blocked, true);
      assert.match(result.reason, /login wall/i);
      assert.match(result.reason, /paste/i, "must offer the manual path that actually works");
    }
  });

  it("names every login-walled platform the product claims to handle", async () => {
    for (const host of [
      "https://instagram.com/p/abc",
      "https://www.tiktok.com/@x/video/1",
      "https://x.com/a/status/1",
      "https://twitter.com/a/status/1",
    ]) {
      const result = await fetchPublicPage(host);
      assert.equal(result.ok, false, `${host} should not be attempted`);
      if (!result.ok) assert.equal(result.blocked, true);
    }
  });
});

describe("readable extraction", () => {
  it("pulls out the title and drops markup", () => {
    const { title, text } = extractReadable(
      "<html><head><title>A post</title></head><body><p>First line.</p><p>Second line.</p></body></html>",
    );
    assert.equal(title, "A post");
    assert.match(text, /First line\./);
    assert.match(text, /Second line\./);
    assert.doesNotMatch(text, /</);
  });

  it("removes scripts, styles and navigation", () => {
    const { text } = extractReadable(
      "<body><script>window.x = 1</script><style>.a{color:red}</style><nav>Home About</nav><p>Real content.</p><footer>Legal</footer></body>",
    );
    assert.match(text, /Real content\./);
    assert.doesNotMatch(text, /window\.x/);
    assert.doesNotMatch(text, /color:red/);
    assert.doesNotMatch(text, /Legal/);
  });

  it("keeps block boundaries so sentences do not run together", () => {
    const { text } = extractReadable("<div>One</div><div>Two</div>");
    assert.equal(text, "One\nTwo");
  });

  it("decodes entities without emitting control characters", () => {
    const { text } = extractReadable("<p>Tom&#39;s &amp; Jerry&nbsp;&lt;here&gt; &#1;</p>");
    assert.match(text, /Tom's & Jerry <here>/);
    for (const ch of text) {
      const code = ch.codePointAt(0) ?? 0;
      assert.ok(code === 10 || code >= 32, `control character ${code} survived extraction`);
    }
  });

  it("caps the extracted text", () => {
    const { text } = extractReadable(`<p>${"word ".repeat(20_000)}</p>`);
    assert.ok(text.length <= 20_000);
  });
});
