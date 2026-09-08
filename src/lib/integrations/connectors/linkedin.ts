import { envAuthConfig, http, mapHttpError, type Connector } from "./index";

/**
 * LinkedIn — Posts API (member/organisation posts) and the limited analytics
 * available to a non-partner app. Member-post impressions are not exposed
 * without Marketing Developer Platform access, so `views` is reported as
 * unsupported rather than guessed from likes.
 */
const API = "https://api.linkedin.com";

export const linkedin: Connector = {
  provider: "linkedin",
  label: "LinkedIn",
  scopes: { publish: ["openid", "profile", "w_member_social"], analytics: ["r_member_postAnalytics"] },
  gates: ["Community Management API access for organisation posts", "Marketing Developer Platform for post analytics"],
  authConfig: (env) => envAuthConfig({ provider: "linkedin", authorizeUrl: "https://www.linkedin.com/oauth/v2/authorization", tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken", scopes: ["openid", "profile", "w_member_social"], usesPkce: false, env }),
  externalIdFromUrl: (url) => /urn:li:(?:share|ugcPost|activity):(\d+)/.exec(url)?.[0] ?? /activity[-:](\d{15,})/.exec(url)?.[1] ?? null,

  async publish(input) {
    if (!input.externalAccountId) return { ok: false, code: "invalid_request", message: "LinkedIn needs the member URN (person id) to post as.", retryable: false };
    const body = {
      author: input.externalAccountId.startsWith("urn:") ? input.externalAccountId : `urn:li:person:${input.externalAccountId}`,
      commentary: input.text,
      visibility: "PUBLIC",
      distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    };
    const res = await http(`${API}/rest/posts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${input.accessToken}`, "Content-Type": "application/json", "LinkedIn-Version": "202409", "X-Restli-Protocol-Version": "2.0.0" },
      body: JSON.stringify(body),
    });
    if (res.status === 201 || res.status === 200) {
      const id = res.headers.get("x-restli-id") ?? (res.json as { id?: string } | null)?.id ?? "";
      return { ok: true, externalId: id, url: id ? `https://www.linkedin.com/feed/update/${id}/` : null, providerStatus: "PUBLISHED", raw: res.json };
    }
    return { ok: false, ...mapHttpError(res.status, res.headers, res.json ?? res.text, "LinkedIn") };
  },

  async fetchMetrics(input) {
    const endpoint = `${API}/rest/socialActions/${encodeURIComponent(input.externalId)}`;
    const res = await http(endpoint, { headers: { Authorization: `Bearer ${input.accessToken}`, "LinkedIn-Version": "202409", "X-Restli-Protocol-Version": "2.0.0" } });
    if (res.status !== 200) return { ok: false, ...mapHttpError(res.status, res.headers, res.json ?? res.text, "LinkedIn") };
    const j = res.json as { likesSummary?: { totalLikes?: number }; commentsSummary?: { totalFirstLevelComments?: number } } | null;
    return {
      ok: true,
      endpoint: "rest/socialActions",
      measuredAt: new Date(),
      metrics: { likes: j?.likesSummary?.totalLikes ?? null, comments: j?.commentsSummary?.totalFirstLevelComments ?? null, shares: null, impressions: null, ctrPct: null },
      raw: j,
    };
  },
};
