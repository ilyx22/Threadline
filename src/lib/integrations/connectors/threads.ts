import { envAuthConfig, http, mapHttpError, type Connector } from "./index";

/**
 * Threads via the Threads API (INT-06), graph.threads.net. Publishing is two
 * calls, like Instagram:
 *   POST /{threads-user-id}/threads          { media_type: TEXT | IMAGE | VIDEO, text, image_url | video_url }
 *   POST /{threads-user-id}/threads_publish  { creation_id }
 * A video container processes first; `publishStatus` polls
 * `GET /{container-id}?fields=status,error_message`. Insights come from
 * `/{media-id}/insights`. Text is limited to 500 characters. Needs Meta App
 * Review for threads_content_publish and threads_manage_insights.
 */
const API = "https://graph.threads.net/v1.0";

export const threads: Connector = {
  provider: "threads",
  label: "Threads",
  scopes: { publish: ["threads_basic", "threads_content_publish"], analytics: ["threads_basic", "threads_manage_insights"] },
  gates: ["Meta App Review for threads_content_publish and threads_manage_insights", "A Threads profile for the founder"],
  authConfig: (env) =>
    envAuthConfig({
      provider: "threads",
      authorizeUrl: "https://threads.net/oauth/authorize",
      tokenUrl: "https://graph.threads.net/oauth/access_token",
      scopes: ["threads_basic", "threads_content_publish", "threads_manage_insights"],
      usesPkce: false,
      env,
    }),
  externalIdFromUrl: () => null, // post shortcodes are not media ids

  async publish(input) {
    if (!input.externalAccountId) return { ok: false, code: "invalid_request", message: "Threads needs the Threads user id.", retryable: false };
    if (input.text.length > 500) return { ok: false, code: "invalid_request", message: "Threads posts are limited to 500 characters.", retryable: false };
    const kind = input.mediaKind ?? "none";
    if (kind !== "none" && !input.mediaUrl) return { ok: false, code: "invalid_request", message: "Threads needs a public media URL for an image or video.", retryable: false };
    const container = await http(`${API}/${input.externalAccountId}/threads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type: kind === "video" ? "VIDEO" : kind === "image" ? "IMAGE" : "TEXT",
        text: input.text,
        ...(kind === "video" ? { video_url: input.mediaUrl } : kind === "image" ? { image_url: input.mediaUrl } : {}),
        access_token: input.accessToken,
      }),
    });
    if (container.status !== 200) return { ok: false, ...mapHttpError(container.status, container.headers, container.json ?? container.text, "Threads") };
    const creationId = (container.json as { id?: string } | null)?.id;
    if (!creationId) return { ok: false, code: "provider_error", message: "Threads returned no container id.", retryable: true };
    // Video containers must finish processing before they can be published.
    if (kind === "video") return { ok: true, externalId: creationId, url: null, providerStatus: "CONTAINER_PROCESSING", raw: container.json };
    return publishContainer(input.externalAccountId, creationId, input.accessToken);
  },

  async publishStatus(input) {
    const res = await http(`${API}/${input.externalId}?fields=status,error_message&access_token=${encodeURIComponent(input.accessToken)}`);
    if (res.status !== 200) return { ok: false, ...mapHttpError(res.status, res.headers, res.json ?? res.text, "Threads") };
    const j = res.json as { status?: string; error_message?: string } | null;
    if (j?.status === "PUBLISHED") return { ok: true, status: "published", externalId: input.externalId };
    if (j?.status === "FINISHED") return { ok: true, status: "processing", message: "Container ready to publish" };
    if (j?.status === "ERROR" || j?.status === "EXPIRED") return { ok: true, status: "failed", message: j.error_message ?? `Threads container ${j.status}` };
    return { ok: true, status: "processing" };
  },

  async fetchMetrics(input) {
    const res = await http(`${API}/${input.externalId}/insights?metric=views,likes,replies,reposts,quotes,shares&access_token=${encodeURIComponent(input.accessToken)}`);
    if (res.status !== 200) return { ok: false, ...mapHttpError(res.status, res.headers, res.json ?? res.text, "Threads") };
    const data = (res.json as { data?: { name: string; values?: { value: number }[]; total_value?: { value: number } }[] } | null)?.data ?? [];
    const get = (name: string) => {
      const d = data.find((x) => x.name === name);
      return d?.values?.[0]?.value ?? d?.total_value?.value ?? null;
    };
    return { ok: true, endpoint: "media/insights", measuredAt: new Date(), metrics: { views: get("views"), likes: get("likes"), comments: get("replies"), shares: (get("reposts") ?? 0) + (get("quotes") ?? 0) + (get("shares") ?? 0), reach: null, saves: null, impressions: null }, raw: res.json };
  },
};

/** Publish a finished container (text and image immediately; video once processing is FINISHED). */
export async function publishContainer(userId: string, creationId: string, accessToken: string) {
  const pub = await http(`${API}/${userId}/threads_publish`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ creation_id: creationId, access_token: accessToken }) });
  if (pub.status !== 200) return { ok: false as const, ...mapHttpError(pub.status, pub.headers, pub.json ?? pub.text, "Threads") };
  const mediaId = (pub.json as { id?: string } | null)?.id;
  if (!mediaId) return { ok: false as const, code: "provider_error" as const, message: "Threads returned no media id.", retryable: true };
  return { ok: true as const, externalId: mediaId, url: null, providerStatus: "PUBLISHED", raw: pub.json };
}
