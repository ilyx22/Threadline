import { envAuthConfig, http, mapHttpError, type Connector } from "./index";

/**
 * TikTok — Content Posting API (direct post from a URL the platform pulls)
 * and the Display/Research surfaces for metrics. Unaudited apps can only
 * post privately (SELF_ONLY) — the connector never pretends otherwise and
 * records that state on the publish outcome.
 *
 * TikTok's Direct Post guidelines, enforced here rather than left to the UI:
 * the creator's current settings are queried before every post; privacy is
 * the person's explicit choice from the options TikTok returns (never a
 * default once audited); comments, duets and stitches stay off unless the
 * person turned them on and the creator allows them; commercial-content
 * disclosure is passed through as chosen.
 */
const OPEN = "https://open.tiktokapis.com/v2";

type CreatorInfo = {
  creator_nickname?: string;
  privacy_level_options?: string[];
  comment_disabled?: boolean;
  duet_disabled?: boolean;
  stitch_disabled?: boolean;
};

export const tiktok: Connector = {
  provider: "tiktok",
  label: "TikTok",
  scopes: { publish: ["user.info.basic", "video.publish", "video.upload"], analytics: ["video.list"] },
  gates: ["App audit before public (non-SELF_ONLY) posting", "Verified domain for pull-from-URL uploads"],
  authConfig: (env) => envAuthConfig({ provider: "tiktok", authorizeUrl: "https://www.tiktok.com/v2/auth/authorize/", tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/", scopes: ["user.info.basic", "video.publish", "video.upload", "video.list"], usesPkce: true, env }),
  externalIdFromUrl: (url) => /video\/(\d{15,})/.exec(url)?.[1] ?? null,

  async publish(input) {
    if (!input.mediaUrl) return { ok: false, code: "invalid_request", message: "TikTok needs a video URL on a verified domain.", retryable: false };
    const audited = process.env.TIKTOK_APP_AUDITED === "true";
    const opts = input.platformOptions ?? {};

    // 1. The creator's current posting settings, queried before every post.
    const info = await http(`${OPEN}/post/publish/creator_info/query/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${input.accessToken}`, "Content-Type": "application/json; charset=UTF-8" },
    });
    if (info.status !== 200) return { ok: false, ...mapHttpError(info.status, info.headers, info.json ?? info.text, "TikTok") };
    const creator = ((info.json as { data?: CreatorInfo } | null)?.data ?? {}) as CreatorInfo;

    // 2. Privacy: private until audited; after that, only the person's explicit choice.
    let privacy = "SELF_ONLY";
    if (audited) {
      const chosen = typeof opts.privacyLevel === "string" ? opts.privacyLevel : null;
      if (!chosen) return { ok: false, code: "invalid_request", message: "Choose who can see this TikTok before posting.", retryable: false };
      if (creator.privacy_level_options && !creator.privacy_level_options.includes(chosen)) {
        return { ok: false, code: "invalid_request", message: `This TikTok account does not allow "${chosen}". Choose one of: ${creator.privacy_level_options.join(", ")}.`, retryable: false };
      }
      privacy = chosen;
    }

    // 3. Interactions off unless turned on and allowed by the creator.
    const off = (allowed: unknown, creatorDisabled?: boolean) => allowed !== true || creatorDisabled === true;

    const res = await http(`${OPEN}/post/publish/video/init/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${input.accessToken}`, "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify({
        post_info: {
          title: (input.title ?? input.text).slice(0, 2200),
          privacy_level: privacy,
          disable_comment: off(opts.allowComment, creator.comment_disabled),
          disable_duet: off(opts.allowDuet, creator.duet_disabled),
          disable_stitch: off(opts.allowStitch, creator.stitch_disabled),
          // 4. Commercial content disclosure, exactly as chosen.
          brand_content_toggle: opts.brandContent === true,
          brand_organic_toggle: opts.brandOrganic === true,
        },
        source_info: { source: "PULL_FROM_URL", video_url: input.mediaUrl },
      }),
    });
    if (res.status !== 200) return { ok: false, ...mapHttpError(res.status, res.headers, res.json ?? res.text, "TikTok") };
    const j = res.json as { data?: { publish_id?: string }; error?: { code?: string; message?: string } } | null;
    if (j?.error?.code && j.error.code !== "ok") return { ok: false, code: "invalid_request", message: `TikTok: ${j.error.code} ${j.error.message ?? ""}`, retryable: false };
    const publishId = j?.data?.publish_id;
    if (!publishId) return { ok: false, code: "provider_error", message: "TikTok returned no publish id.", retryable: true };
    return { ok: true, externalId: publishId, url: null, providerStatus: audited ? "PROCESSING" : "PROCESSING_SELF_ONLY", raw: j };
  },

  async publishStatus(input) {
    const res = await http(`${OPEN}/post/publish/status/fetch/`, { method: "POST", headers: { Authorization: `Bearer ${input.accessToken}`, "Content-Type": "application/json; charset=UTF-8" }, body: JSON.stringify({ publish_id: input.externalId }) });
    if (res.status !== 200) return { ok: false, ...mapHttpError(res.status, res.headers, res.json ?? res.text, "TikTok") };
    const d = (res.json as { data?: { status?: string; publicaly_available_post_id?: string[]; fail_reason?: string } } | null)?.data;
    if (d?.status === "PUBLISH_COMPLETE") return { ok: true, status: "published", externalId: d.publicaly_available_post_id?.[0] ?? input.externalId };
    if (d?.status === "FAILED") return { ok: true, status: "failed", message: d.fail_reason ?? "TikTok reported FAILED" };
    return { ok: true, status: "processing" };
  },

  async fetchMetrics(input) {
    const res = await http(`${OPEN}/video/query/?fields=id,view_count,like_count,comment_count,share_count,duration`, { method: "POST", headers: { Authorization: `Bearer ${input.accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ filters: { video_ids: [input.externalId] } }) });
    if (res.status !== 200) return { ok: false, ...mapHttpError(res.status, res.headers, res.json ?? res.text, "TikTok") };
    const v = (res.json as { data?: { videos?: Record<string, number>[] } } | null)?.data?.videos?.[0];
    if (!v) return { ok: false, code: "not_found", message: "TikTok returned no video for that id." };
    return { ok: true, endpoint: "video/query", measuredAt: new Date(), metrics: { views: v.view_count ?? null, likes: v.like_count ?? null, comments: v.comment_count ?? null, shares: v.share_count ?? null, watchTimeSec: null, avgViewSec: null, retentionPct: null }, raw: v };
  },
};
