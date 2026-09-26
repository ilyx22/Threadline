import { envAuthConfig, http, mapHttpError, type Connector } from "./index";

/**
 * Facebook Pages via the Graph API (INT-06). A Page post is published with the
 * Page access token (obtained from the user token through `/me/accounts`):
 *   text or link  POST /{page-id}/feed    { message }
 *   photo         POST /{page-id}/photos  { url, caption }
 *   video         POST /{page-id}/videos  { file_url, description }  (processes asynchronously)
 * Video status is `GET /{video-id}?fields=status`; engagement is read from the
 * post object's reactions, comments and shares summaries, and video views from
 * `/{video-id}/video_insights`. Needs Meta App Review for pages_manage_posts,
 * pages_read_engagement and read_insights, and business verification.
 */
const GRAPH = "https://graph.facebook.com/v21.0";

export const facebook: Connector = {
  provider: "facebook",
  label: "Facebook Page",
  scopes: { publish: ["pages_show_list", "pages_manage_posts", "pages_read_engagement"], analytics: ["read_insights", "pages_read_engagement"] },
  gates: ["Meta App Review for pages_manage_posts, pages_read_engagement and read_insights", "Business verification", "The founder must be an admin of the Facebook Page"],
  authConfig: (env) =>
    envAuthConfig({
      provider: "facebook",
      authorizeUrl: "https://www.facebook.com/v21.0/dialog/oauth",
      tokenUrl: "https://graph.facebook.com/v21.0/oauth/access_token",
      scopes: ["pages_show_list", "pages_manage_posts", "pages_read_engagement", "read_insights"],
      usesPkce: false,
      env,
    }),
  externalIdFromUrl: () => null, // Page post URLs do not carry the Graph id reliably; the id comes back from publishing.
  // A Page is published with the Page's own token, from /me/accounts. With several Pages the first
  // is used and named, so an admin can see which one was connected.
  async resolveAccount(accessToken) {
    const res = await http(`${GRAPH}/me/accounts?fields=id,name,access_token&access_token=${encodeURIComponent(accessToken)}`);
    const page = (res.json as { data?: { id?: string; name?: string; access_token?: string }[] } | null)?.data?.[0];
    return res.status === 200 && page?.id && page.access_token ? { id: page.id, label: page.name ?? null, accessToken: page.access_token } : null;
  },

  async publish(input) {
    if (!input.externalAccountId) return { ok: false, code: "invalid_request", message: "Facebook needs the Page id.", retryable: false };
    const kind = input.mediaKind ?? (input.mediaUrl ? "video" : "none");
    if (kind !== "none" && !input.mediaUrl) return { ok: false, code: "invalid_request", message: "Facebook needs a public media URL for a photo or video.", retryable: false };
    const [path, body] =
      kind === "video"
        ? ["videos", { file_url: input.mediaUrl, description: input.text.slice(0, 5000), title: input.title?.slice(0, 250) }]
        : kind === "image"
          ? ["photos", { url: input.mediaUrl, caption: input.text.slice(0, 5000) }]
          : ["feed", { message: input.text.slice(0, 63206) }];
    const res = await http(`${GRAPH}/${input.externalAccountId}/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, access_token: input.accessToken }) });
    if (res.status !== 200) return { ok: false, ...mapHttpError(res.status, res.headers, res.json ?? res.text, "Facebook") };
    const j = res.json as { id?: string; post_id?: string } | null;
    const id = j?.post_id ?? j?.id;
    if (!id) return { ok: false, code: "provider_error", message: "Facebook returned no post id.", retryable: true };
    return { ok: true, externalId: id, url: kind === "video" ? null : `https://www.facebook.com/${id}`, providerStatus: kind === "video" ? "VIDEO_PROCESSING" : "PUBLISHED", raw: res.json };
  },

  async publishStatus(input) {
    const res = await http(`${GRAPH}/${input.externalId}?fields=status,permalink_url&access_token=${encodeURIComponent(input.accessToken)}`);
    if (res.status !== 200) return { ok: false, ...mapHttpError(res.status, res.headers, res.json ?? res.text, "Facebook") };
    const j = res.json as { status?: { video_status?: string }; permalink_url?: string } | null;
    const s = j?.status?.video_status;
    if (s === "ready" || s === undefined) return { ok: true, status: "published", externalId: input.externalId, url: j?.permalink_url ? `https://www.facebook.com${j.permalink_url.replace(/^https?:\/\/[^/]+/, "")}` : null };
    if (s === "error" || s === "expired") return { ok: true, status: "failed", message: `Facebook video ${s}` };
    return { ok: true, status: "processing" };
  },

  async fetchMetrics(input) {
    const fields = "shares,comments.summary(true).limit(0),reactions.summary(true).limit(0)";
    const res = await http(`${GRAPH}/${input.externalId}?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(input.accessToken)}`);
    if (res.status !== 200) return { ok: false, ...mapHttpError(res.status, res.headers, res.json ?? res.text, "Facebook") };
    const j = res.json as { shares?: { count?: number }; comments?: { summary?: { total_count?: number } }; reactions?: { summary?: { total_count?: number } } } | null;
    // Video views come from video_insights; a post without a video has none.
    let views: number | null = null;
    const vi = await http(`${GRAPH}/${input.externalId}/video_insights?metric=total_video_views&access_token=${encodeURIComponent(input.accessToken)}`);
    if (vi.status === 200) views = (vi.json as { data?: { values?: { value?: number }[] }[] } | null)?.data?.[0]?.values?.[0]?.value ?? null;
    return {
      ok: true,
      endpoint: "post fields + video_insights",
      measuredAt: new Date(),
      metrics: { views, likes: j?.reactions?.summary?.total_count ?? null, comments: j?.comments?.summary?.total_count ?? null, shares: j?.shares?.count ?? 0, reach: null, saves: null, impressions: null },
      raw: res.json,
    };
  },
};
