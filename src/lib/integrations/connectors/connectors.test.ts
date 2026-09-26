import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import { __setConnectorFetch, connectorReadiness, getConnector, listConnectors, mapHttpError } from "./index";
import { publishThread } from "./x";

const respond = (status: number, body: unknown, headers: Record<string, string> = {}) => new Response(typeof body === "string" ? body : JSON.stringify(body), { status, headers });

afterEach(() => __setConnectorFetch(null));

describe("connector registry and readiness", () => {
  test("seven platforms register, each with scopes and named gates", () => {
    assert.deepEqual(listConnectors().map((c) => c.provider).sort(), ["facebook", "instagram", "linkedin", "threads", "tiktok", "x", "youtube"]);
    for (const c of listConnectors()) {
      assert.ok(c.scopes.publish.length > 0);
      assert.ok(c.gates.length > 0);
    }
  });

  test("readiness is CREDENTIALS_MISSING without client ids and AUTH_REQUIRED with them; never 'connected' from config alone", () => {
    assert.equal(connectorReadiness("x", {}).state, "CREDENTIALS_MISSING");
    assert.equal(connectorReadiness("x", { X_CLIENT_ID: "id", X_CLIENT_SECRET: "s" }).state, "AUTH_REQUIRED");
    assert.equal(connectorReadiness("myspace", {}).state, "UNSUPPORTED");
  });

  test("auth config is built from environment and carries PKCE where the provider supports it", () => {
    const yt = getConnector("youtube")!.authConfig({ YOUTUBE_CLIENT_ID: "a", YOUTUBE_CLIENT_SECRET: "b" });
    assert.equal(yt?.usesPkce, true);
    assert.ok(yt?.scopes.some((s) => s.includes("youtube.upload")));
    const li = getConnector("linkedin")!.authConfig({ LINKEDIN_CLIENT_ID: "a", LINKEDIN_CLIENT_SECRET: "b" });
    assert.equal(li?.usesPkce, false);
    assert.equal(getConnector("linkedin")!.authConfig({}), null);
  });
});

describe("error mapping", () => {
  test("401 → auth_expired, 403 scope → forbidden_scope, 403 other → review_required, 429 → rate_limited with retry-after, 5xx retryable", () => {
    const h = (o: Record<string, string> = {}) => new Headers(o);
    assert.equal(mapHttpError(401, h(), {}, "P").code, "auth_expired");
    assert.equal(mapHttpError(403, h(), { message: "insufficient scope" }, "P").code, "forbidden_scope");
    assert.equal(mapHttpError(403, h(), { message: "app not approved" }, "P").code, "review_required");
    const rl = mapHttpError(429, h({ "retry-after": "120" }), {}, "P");
    assert.equal(rl.code, "rate_limited");
    assert.equal(rl.retryAfterSec, 120);
    assert.equal(rl.retryable, true);
    assert.equal(mapHttpError(503, h(), "", "P").retryable, true);
    assert.equal(mapHttpError(400, h(), "", "P").retryable, false);
  });
});

describe("publish and metrics through the mocked boundary", () => {
  test("X publish success and metrics parse; expired token is classified", async () => {
    __setConnectorFetch(async (input, init) => {
      const url = String(input);
      if (url.endsWith("/tweets") && init?.method === "POST") return respond(201, { data: { id: "1234567890123" } });
      if (url.includes("/tweets/1234567890123")) return respond(200, { data: { public_metrics: { impression_count: 900, like_count: 12, reply_count: 3, retweet_count: 2, quote_count: 1 } } });
      return respond(401, { title: "Unauthorized" });
    });
    const x = getConnector("x")!;
    const pub = await x.publish({ accessToken: "t", text: "hello" });
    assert.ok(pub.ok && pub.externalId === "1234567890123" && pub.url?.includes("1234567890123"));
    const m = await x.fetchMetrics({ accessToken: "t", externalId: "1234567890123" });
    assert.ok(m.ok && m.metrics.impressions === 900 && m.metrics.shares === 3);
    const bad = await x.fetchMetrics({ accessToken: "t", externalId: "other" });
    assert.ok(!bad.ok && bad.code === "auth_expired");
  });

  test("a thread posts as replies and stops at the first failure without losing what was posted", async () => {
    let n = 0;
    __setConnectorFetch(async (_input, init) => {
      const body = JSON.parse(String(init?.body)) as { reply?: { in_reply_to_tweet_id: string } };
      n++;
      if (n === 1) { assert.equal(body.reply, undefined); return respond(201, { data: { id: "a" } }); }
      if (n === 2) { assert.equal(body.reply?.in_reply_to_tweet_id, "a"); return respond(201, { data: { id: "b" } }); }
      return respond(429, {}, { "retry-after": "30" });
    });
    const r = await publishThread("t", ["one", "two", "three"]);
    assert.ok(!r.ok && r.posted.length === 2 && /rate limited/.test(r.message));
  });

  test("YouTube metrics merge Data API statistics with Analytics retention and degrade to unavailable when analytics fails", async () => {
    __setConnectorFetch(async (input) => {
      const url = String(input);
      if (url.includes("/videos?part=statistics")) return respond(200, { items: [{ statistics: { viewCount: "4100", likeCount: "80", commentCount: "9" } }] });
      if (url.includes("youtubeanalytics")) return respond(403, { error: { message: "insufficient permissions" } });
      return respond(500, "");
    });
    const yt = getConnector("youtube")!;
    const m = await yt.fetchMetrics({ accessToken: "t", externalId: "abcdefghijk" });
    assert.ok(m.ok && m.metrics.views === 4100 && m.metrics.retentionPct === null);
    assert.equal(yt.externalIdFromUrl?.("https://youtu.be/abcdefghijk"), "abcdefghijk");
    assert.equal(yt.externalIdFromUrl?.("https://www.youtube.com/shorts/ZYXWVUTSRQP"), "ZYXWVUTSRQP");
  });

  test("Instagram Reels return a processing container and status polling resolves it", async () => {
    __setConnectorFetch(async (input, init) => {
      const url = String(input);
      if (url.endsWith("/media") && init?.method === "POST") return respond(200, { id: "container1" });
      if (url.includes("/container1?fields=status_code")) return respond(200, { status_code: "FINISHED" });
      return respond(400, {});
    });
    const ig = getConnector("instagram")!;
    const pub = await ig.publish({ accessToken: "t", externalAccountId: "178", text: "cap", mediaUrl: "https://cdn.example/x.mp4", mediaKind: "video" });
    assert.ok(pub.ok && pub.providerStatus === "CONTAINER_PROCESSING");
    const st = await ig.publishStatus!({ accessToken: "t", externalId: "container1" });
    assert.ok(st.ok && st.status === "ready", "a finished container still needs media_publish");
  });

  test("TikTok posts SELF_ONLY until the app is audited and says so on the outcome", async () => {
    delete process.env.TIKTOK_APP_AUDITED;
    __setConnectorFetch(async (_input, init) => {
      const body = JSON.parse(String(init?.body)) as { post_info: { privacy_level: string } };
      assert.equal(body.post_info.privacy_level, "SELF_ONLY");
      return respond(200, { data: { publish_id: "p1" }, error: { code: "ok" } });
    });
    const tt = getConnector("tiktok")!;
    const pub = await tt.publish({ accessToken: "t", text: "hi", mediaUrl: "https://verified.example/v.mp4", mediaKind: "video" });
    assert.ok(pub.ok && pub.providerStatus === "PROCESSING_SELF_ONLY");
  });

  test("LinkedIn refuses to post without an author URN and parses the restli id on success", async () => {
    const li = getConnector("linkedin")!;
    const noAuthor = await li.publish({ accessToken: "t", text: "x" });
    assert.ok(!noAuthor.ok && noAuthor.code === "invalid_request");
    __setConnectorFetch(async () => respond(201, "", { "x-restli-id": "urn:li:share:99" }));
    const pub = await li.publish({ accessToken: "t", text: "x", externalAccountId: "abc" });
    assert.ok(pub.ok && pub.externalId === "urn:li:share:99");
  });
});

describe("Facebook Pages and Threads (INT-06)", () => {
  test("Facebook: text to /feed, video to /videos with processing, engagement from post summaries", async () => {
    const calls: { url: string; body: string }[] = [];
    __setConnectorFetch((async (u: string | URL, init?: RequestInit) => {
      const url = String(u);
      calls.push({ url, body: String(init?.body ?? "") });
      if (url.includes("/feed")) return respond(200, { id: "123_456" });
      if (url.includes("/videos")) return respond(200, { id: "789" });
      if (url.includes("video_insights")) return respond(200, { data: [{ values: [{ value: 1200 }] }] });
      if (url.includes("fields=status")) return respond(200, { status: { video_status: "processing" } });
      return respond(200, { shares: { count: 3 }, comments: { summary: { total_count: 4 } }, reactions: { summary: { total_count: 50 } } });
    }) as typeof fetch);
    const fb = getConnector("facebook")!;
    assert.equal((await fb.publish({ accessToken: "t", text: "Hi", mediaKind: "none" })).ok, false, "needs the page id");
    const text = await fb.publish({ accessToken: "t", externalAccountId: "page1", text: "Hello", mediaKind: "none" });
    assert.deepEqual(text.ok && [text.externalId, text.providerStatus], ["123_456", "PUBLISHED"]);
    assert.match(calls[0].url, /\/page1\/feed$/);
    const video = await fb.publish({ accessToken: "t", externalAccountId: "page1", text: "Cut", mediaKind: "video", mediaUrl: "https://cdn.example/v.mp4" });
    assert.deepEqual(video.ok && video.providerStatus, "VIDEO_PROCESSING");
    assert.match(calls[1].body, /file_url/);
    assert.deepEqual(await fb.publishStatus!({ accessToken: "t", externalId: "789" }), { ok: true, status: "processing" });
    const m = await fb.fetchMetrics({ accessToken: "t", externalId: "789" });
    assert.deepEqual(m.ok && [m.metrics.views, m.metrics.likes, m.metrics.comments, m.metrics.shares], [1200, 50, 4, 3]);
    assert.equal(getConnector("facebook")!.authConfig({ FACEBOOK_CLIENT_ID: "a", FACEBOOK_CLIENT_SECRET: "b" })?.scopes.includes("pages_manage_posts"), true);
  });

  test("Threads: container then publish for text; video waits for processing; 500-character limit; insights mapped", async () => {
    const calls: string[] = [];
    __setConnectorFetch((async (u: string | URL) => {
      const url = String(u);
      calls.push(url);
      if (url.endsWith("/threads")) return respond(200, { id: "c1" });
      if (url.endsWith("/threads_publish")) return respond(200, { id: "m1" });
      if (url.includes("fields=status")) return respond(200, { status: "ERROR", error_message: "bad video" });
      return respond(200, { data: [{ name: "views", values: [{ value: 900 }] }, { name: "likes", values: [{ value: 20 }] }, { name: "replies", values: [{ value: 2 }] }, { name: "reposts", values: [{ value: 1 }] }] });
    }) as typeof fetch);
    const th = getConnector("threads")!;
    const r = await th.publish({ accessToken: "t", externalAccountId: "u1", text: "Short post", mediaKind: "none" });
    assert.deepEqual(r.ok && r.externalId, "m1");
    assert.deepEqual(calls.slice(0, 2).map((c) => c.split("/").pop()), ["threads", "threads_publish"]);
    const long = await th.publish({ accessToken: "t", externalAccountId: "u1", text: "x".repeat(501) });
    assert.equal(long.ok, false);
    const v = await th.publish({ accessToken: "t", externalAccountId: "u1", text: "Clip", mediaKind: "video", mediaUrl: "https://cdn.example/v.mp4" });
    assert.deepEqual(v.ok && v.providerStatus, "CONTAINER_PROCESSING");
    assert.deepEqual(await th.publishStatus!({ accessToken: "t", externalId: "c1" }), { ok: true, status: "failed", message: "bad video" });
    const m = await th.fetchMetrics({ accessToken: "t", externalId: "m1" });
    assert.deepEqual(m.ok && [m.metrics.views, m.metrics.likes, m.metrics.comments, m.metrics.shares], [900, 20, 2, 1]);
  });
});

describe("account resolution after connecting", () => {
  test("LinkedIn resolves the member URN from OpenID userinfo; Facebook swaps in the Page token", async () => {
    __setConnectorFetch((async (u: string | URL) => {
      const url = String(u);
      if (url.endsWith("/v2/userinfo")) return respond(200, { sub: "abc123", name: "Alex Morgan" });
      if (url.includes("/me/accounts")) return respond(200, { data: [{ id: "page9", name: "Northbeam", access_token: "PAGE-TOKEN" }] });
      return respond(404, {});
    }) as typeof fetch);
    assert.deepEqual(await getConnector("linkedin")!.resolveAccount!("t"), { id: "urn:li:person:abc123", label: "Alex Morgan" });
    assert.deepEqual(await getConnector("facebook")!.resolveAccount!("t"), { id: "page9", label: "Northbeam", accessToken: "PAGE-TOKEN" });
    __setConnectorFetch((async () => respond(401, {})) as typeof fetch);
    assert.equal(await getConnector("linkedin")!.resolveAccount!("t"), null, "no account means no connection claimed");
  });
});
