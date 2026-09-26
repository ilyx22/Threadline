import { envAuthConfig, http, mapHttpError, type Connector } from "./index";

/**
 * Instagram via the Graph API (professional accounts). Publishing is two
 * calls — create a media container, then publish it — and Reels process
 * asynchronously, so `publishStatus` polls the container. Insights come from
 * `/{media-id}/insights`. Requires App Review for `instagram_content_publish`.
 */
const GRAPH = "https://graph.facebook.com/v21.0";

export const instagram: Connector = {
  provider: "instagram",
  label: "Instagram",
  scopes: { publish: ["instagram_basic", "instagram_content_publish", "pages_show_list", "business_management"], analytics: ["instagram_manage_insights"] },
  gates: ["Meta App Review for instagram_content_publish and instagram_manage_insights", "Business verification", "Professional (business/creator) Instagram account linked to a Facebook Page"],
  authConfig: (env) => envAuthConfig({ provider: "instagram", authorizeUrl: "https://www.facebook.com/v21.0/dialog/oauth", tokenUrl: "https://graph.facebook.com/v21.0/oauth/access_token", scopes: ["instagram_basic", "instagram_content_publish", "instagram_manage_insights", "pages_show_list", "business_management"], usesPkce: false, env }),
  externalIdFromUrl: () => null, // Instagram shortcodes are not media ids; the id comes back from publishing.

  async publish(input) {
    if (!input.externalAccountId) return { ok: false, code: "invalid_request", message: "Instagram needs the professional account id.", retryable: false };
    if (!input.mediaUrl) return { ok: false, code: "invalid_request", message: "Instagram needs a public media URL for the container.", retryable: false };
    const isVideo = input.mediaKind === "video";
    const container = await http(`${GRAPH}/${input.externalAccountId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...(isVideo ? { media_type: "REELS", video_url: input.mediaUrl } : { image_url: input.mediaUrl }), caption: input.text.slice(0, 2200), access_token: input.accessToken }),
    });
    if (container.status !== 200) return { ok: false, ...mapHttpError(container.status, container.headers, container.json ?? container.text, "Instagram") };
    const creationId = (container.json as { id?: string } | null)?.id;
    if (!creationId) return { ok: false, code: "provider_error", message: "Instagram returned no container id.", retryable: true };
    if (isVideo) return { ok: true, externalId: creationId, url: null, providerStatus: "CONTAINER_PROCESSING", raw: container.json };
    const pub = await http(`${GRAPH}/${input.externalAccountId}/media_publish`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ creation_id: creationId, access_token: input.accessToken }) });
    if (pub.status !== 200) return { ok: false, ...mapHttpError(pub.status, pub.headers, pub.json ?? pub.text, "Instagram") };
    const mediaId = (pub.json as { id?: string } | null)?.id ?? creationId;
    return { ok: true, externalId: mediaId, url: null, providerStatus: "PUBLISHED", raw: pub.json };
  },

  async publishStatus(input) {
    const res = await http(`${GRAPH}/${input.externalId}?fields=status_code,status&access_token=${encodeURIComponent(input.accessToken)}`);
    if (res.status !== 200) return { ok: false, ...mapHttpError(res.status, res.headers, res.json ?? res.text, "Instagram") };
    const code = (res.json as { status_code?: string } | null)?.status_code;
    // A finished container is not yet a post: it still needs media_publish (finalize).
    if (code === "FINISHED") return { ok: true, status: "ready", externalId: input.externalId };
    if (code === "PUBLISHED") return { ok: true, status: "published", externalId: input.externalId };
    if (code === "ERROR" || code === "EXPIRED") return { ok: true, status: "failed", message: `Instagram container ${code}` };
    return { ok: true, status: "processing" };
  },

  async finalize(input) {
    const pub = await http(`${GRAPH}/${input.externalAccountId}/media_publish`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ creation_id: input.externalId, access_token: input.accessToken }) });
    if (pub.status !== 200) return { ok: false, ...mapHttpError(pub.status, pub.headers, pub.json ?? pub.text, "Instagram") };
    const mediaId = (pub.json as { id?: string } | null)?.id;
    if (!mediaId) return { ok: false, code: "provider_error", message: "Instagram returned no media id.", retryable: true };
    return { ok: true, externalId: mediaId, url: null, providerStatus: "PUBLISHED", raw: pub.json };
  },

  async fetchMetrics(input) {
    const endpoint = `${GRAPH}/${input.externalId}/insights?metric=plays,reach,likes,comments,shares,saved&access_token=${encodeURIComponent(input.accessToken)}`;
    const res = await http(endpoint);
    if (res.status !== 200) return { ok: false, ...mapHttpError(res.status, res.headers, res.json ?? res.text, "Instagram") };
    const data = (res.json as { data?: { name: string; values?: { value: number }[] }[] } | null)?.data ?? [];
    const get = (name: string) => data.find((d) => d.name === name)?.values?.[0]?.value ?? null;
    return { ok: true, endpoint: "media/insights", measuredAt: new Date(), metrics: { views: get("plays"), reach: get("reach"), likes: get("likes"), comments: get("comments"), shares: get("shares"), saves: get("saved"), impressions: null }, raw: res.json };
  },
};
