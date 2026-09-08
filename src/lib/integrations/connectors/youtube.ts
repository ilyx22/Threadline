import { envAuthConfig, http, mapHttpError, type Connector } from "./index";

/**
 * YouTube — Data API v3 for upload/metadata and public statistics; the
 * Analytics API for retention and CTR. Uploads use the resumable protocol:
 * an init call returns a session URI, the bytes go to it, and the video id
 * comes back. Media bytes are streamed from the storage adapter by the
 * caller; this connector only shapes the requests.
 */
const DATA = "https://www.googleapis.com/youtube/v3";
const UPLOAD = "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status";
const ANALYTICS = "https://youtubeanalytics.googleapis.com/v2/reports";

export const youtube: Connector = {
  provider: "youtube",
  label: "YouTube",
  scopes: { publish: ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube.readonly"], analytics: ["https://www.googleapis.com/auth/yt-analytics.readonly"] },
  gates: ["Google OAuth verification (sensitive scopes) before non-test users can connect", "Audit for youtube.upload quota beyond the default 10,000 units/day"],
  authConfig: (env) => envAuthConfig({ provider: "youtube", authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth", tokenUrl: "https://oauth2.googleapis.com/token", scopes: ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube.readonly", "https://www.googleapis.com/auth/yt-analytics.readonly"], usesPkce: true, extra: { access_type: "offline", prompt: "consent" }, env }),
  externalIdFromUrl: (url) => /(?:v=|youtu\.be\/|shorts\/)([A-Za-z0-9_-]{11})/.exec(url)?.[1] ?? null,

  async publish(input) {
    if (!input.mediaUrl) return { ok: false, code: "invalid_request", message: "YouTube needs a video file.", retryable: false };
    const meta = { snippet: { title: (input.title ?? input.text).slice(0, 100), description: input.text.slice(0, 5000) }, status: { privacyStatus: "private", selfDeclaredMadeForKids: false } };
    const init = await http(UPLOAD, { method: "POST", headers: { Authorization: `Bearer ${input.accessToken}`, "Content-Type": "application/json", "X-Upload-Content-Type": "video/*" }, body: JSON.stringify(meta) });
    if (init.status !== 200) return { ok: false, ...mapHttpError(init.status, init.headers, init.json ?? init.text, "YouTube") };
    const session = init.headers.get("location");
    if (!session) return { ok: false, code: "provider_error", message: "YouTube did not return an upload session.", retryable: true };
    // The caller streams bytes to `session`; here the connector reports the session so the job can continue.
    return { ok: true, externalId: "", url: null, providerStatus: `UPLOAD_SESSION:${session}`, raw: init.json };
  },

  async publishStatus(input) {
    const res = await http(`${DATA}/videos?part=status,processingDetails&id=${encodeURIComponent(input.externalId)}`, { headers: { Authorization: `Bearer ${input.accessToken}` } });
    if (res.status !== 200) return { ok: false, ...mapHttpError(res.status, res.headers, res.json ?? res.text, "YouTube") };
    const item = (res.json as { items?: { status?: { uploadStatus?: string }; processingDetails?: { processingStatus?: string } }[] } | null)?.items?.[0];
    const upload = item?.status?.uploadStatus;
    if (upload === "processed") return { ok: true, status: "published", externalId: input.externalId, url: `https://www.youtube.com/watch?v=${input.externalId}` };
    if (upload === "failed" || upload === "rejected") return { ok: true, status: "failed", message: `YouTube reported ${upload}` };
    return { ok: true, status: "processing" };
  },

  async fetchMetrics(input) {
    const stats = await http(`${DATA}/videos?part=statistics&id=${encodeURIComponent(input.externalId)}`, { headers: { Authorization: `Bearer ${input.accessToken}` } });
    if (stats.status !== 200) return { ok: false, ...mapHttpError(stats.status, stats.headers, stats.json ?? stats.text, "YouTube") };
    const s = (stats.json as { items?: { statistics?: Record<string, string> }[] } | null)?.items?.[0]?.statistics ?? null;
    if (!s) return { ok: false, code: "not_found", message: "YouTube returned no statistics for that video." };
    const num = (v: string | undefined) => (v === undefined ? null : Number(v));
    const metrics: Record<string, number | null> = { views: num(s.viewCount), likes: num(s.likeCount), comments: num(s.commentCount), shares: null, watchTimeSec: null, avgViewSec: null, retentionPct: null, ctrPct: null, impressions: null };
    // Retention / CTR need the Analytics API; a failure here degrades to unavailable rather than failing the read.
    const end = new Date().toISOString().slice(0, 10);
    const analytics = await http(`${ANALYTICS}?ids=channel==MINE&startDate=2020-01-01&endDate=${end}&metrics=estimatedMinutesWatched,averageViewDuration,averageViewPercentage&filters=video==${encodeURIComponent(input.externalId)}`, { headers: { Authorization: `Bearer ${input.accessToken}` } });
    if (analytics.status === 200) {
      const row = (analytics.json as { rows?: number[][] } | null)?.rows?.[0];
      if (row) {
        metrics.watchTimeSec = Math.round((row[0] ?? 0) * 60);
        metrics.avgViewSec = row[1] ?? null;
        metrics.retentionPct = row[2] ?? null;
      }
    }
    return { ok: true, endpoint: "videos.list statistics + youtubeAnalytics.reports", measuredAt: new Date(), metrics, raw: { stats: stats.json, analytics: analytics.status } };
  },
};
