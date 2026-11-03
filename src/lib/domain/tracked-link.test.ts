import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isAutomatedRequest, newSlug, referrerHost, trackedUrl, validateDestination } from "./tracked-link";
import { WorkflowError } from "./workflow";

/**
 * The rule these tests protect: a public URL on Threadline's own domain that
 * forwards anywhere is a phishing primitive. The link looks like Threadline;
 * the destination is not. Validation happens on every write, so a bad value
 * cannot be stored in the first place.
 */

const APP = "https://app.threadline.example";

describe("destination validation", () => {
  it("accepts an ordinary https destination", () => {
    assert.equal(
      validateDestination("https://example.com/enquire").url,
      "https://example.com/enquire",
    );
  });

  it("assumes https when no scheme is given", () => {
    const result = validateDestination("example.com/enquire");
    assert.match(result.url, /^https:\/\//);
    assert.equal(result.host, "example.com");
  });

  it("refuses javascript: and data: outright", () => {
    for (const bad of ["javascript:alert(1)", "data:text/html,<script>alert(1)</script>"]) {
      assert.throws(() => validateDestination(bad), WorkflowError, bad);
    }
  });

  it("refuses other non-web schemes", () => {
    for (const bad of ["file:///etc/passwd", "ftp://example.com"]) {
      assert.throws(() => validateDestination(bad), WorkflowError, bad);
    }
  });

  it("refuses credentials in the URL", () => {
    // The classic trick for making one host look like another in the address
    // bar: https://trusted.com@attacker.example.
    assert.throws(
      () => validateDestination("https://example.com@evil.example/"),
      /username or password/i,
    );
  });

  it("refuses an empty destination", () => {
    assert.throws(() => validateDestination("   "), /needs somewhere to go/i);
  });

  it("refuses nonsense that is not a URL at all", () => {
    assert.throws(() => validateDestination("http://"), WorkflowError);
  });

  it("refuses pointing back at Threadline's own sign-in", () => {
    // A link we published that redirects to our own login page is exactly the
    // shape of a credential-harvesting hop.
    assert.throws(() => validateDestination(`${APP}/login`, APP), /sign-in, API or admin/i);
    assert.throws(() => validateDestination(`${APP}/admin/clients`, APP), WorkflowError);
    assert.throws(() => validateDestination(`${APP}/api/files/x`, APP), WorkflowError);
  });

  it("refuses chaining one tracked link into another", () => {
    assert.throws(() => validateDestination(`${APP}/t/abcd1234`, APP), WorkflowError);
  });

  it("still allows an ordinary page on our own domain", () => {
    assert.doesNotThrow(() => validateDestination(`${APP}/who-its-for`, APP));
  });

  it("allows any client domain, which is the whole point", () => {
    assert.doesNotThrow(() => validateDestination("https://client.example/book", APP));
  });
});

describe("slugs", () => {
  it("is short, url-safe and unguessable in shape", () => {
    for (let i = 0; i < 50; i += 1) {
      const slug = newSlug();
      assert.match(slug, /^[a-z0-9]{1,8}$/, slug);
    }
  });

  it("does not repeat itself", () => {
    // A sequential slug would let anyone enumerate every client's destinations.
    const slugs = new Set(Array.from({ length: 200 }, () => newSlug()));
    assert.ok(slugs.size > 190, `expected near-unique slugs, got ${slugs.size} of 200`);
  });

  it("builds a public URL without a double slash", () => {
    assert.equal(trackedUrl("https://x.example/", "abcd"), "https://x.example/t/abcd");
    assert.equal(trackedUrl("https://x.example", "abcd"), "https://x.example/t/abcd");
  });
});

describe("referrer", () => {
  it("keeps only the host", () => {
    // A full referring URL can carry personal data in its query string.
    assert.equal(
      referrerHost("https://www.linkedin.com/feed/update/123?email=someone%40example.com"),
      "www.linkedin.com",
    );
  });

  it("returns null for nothing or nonsense", () => {
    assert.equal(referrerHost(null), null);
    assert.equal(referrerHost(""), null);
    assert.equal(referrerHost("not a url"), null);
  });
});

describe("automated requests are not clicks", () => {
  it("treats preview crawlers, bots, CLI clients and prefetches as automated", () => {
    for (const ua of [
      "LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)",
      "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
      "Twitterbot/1.0",
      "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
      "WhatsApp/2.23.20.0 A",
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "curl/8.4.0",
      "python-requests/2.31",
    ]) assert.equal(isAutomatedRequest(ua), true, ua);
    assert.equal(isAutomatedRequest(null), true);
    assert.equal(isAutomatedRequest("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0 Safari/537.36", { secPurpose: "prefetch;prerender" }), true);
  });

  it("counts ordinary browsers", () => {
    for (const ua of [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5; rv:131.0) Gecko/20100101 Firefox/131.0",
    ]) assert.equal(isAutomatedRequest(ua), false, ua);
  });
});
