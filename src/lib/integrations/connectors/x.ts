import { envAuthConfig, http, mapHttpError, type Connector } from "./index";

/**
 * X — API v2. Posting is a single call; threads are posted as replies in
 * sequence (see `publishThread`). Public metrics arrive on the tweet object.
 * Access tier decides the monthly write cap and whether metrics beyond
 * public_metrics are available; the tier is an external gate.
 */
const API = "https://api.x.com/2";

export const x: Connector = {
  provider: "x",
  label: "X",
  scopes: { publish: ["tweet.read", "tweet.write", "users.read", "offline.access"], analytics: ["tweet.read"] },
  gates: ["Paid API access tier (Basic or above) for write volume and metrics", "Elevated access for non-public metrics"],
  authConfig: (env) => envAuthConfig({ provider: "x", authorizeUrl: "https://x.com/i/oauth2/authorize", tokenUrl: "https://api.x.com/2/oauth2/token", scopes: ["tweet.read", "tweet.write", "users.read", "offline.access"], usesPkce: true, env }),
  externalIdFromUrl: (url) => /status\/(\d{10,})/.exec(url)?.[1] ?? null,

  async publish(input) {
    const res = await http(`${API}/tweets`, { method: "POST", headers: { Authorization: `Bearer ${input.accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ text: input.text.slice(0, 280) }) });
    if (res.status !== 201) return { ok: false, ...mapHttpError(res.status, res.headers, res.json ?? res.text, "X") };
    const id = (res.json as { data?: { id?: string } } | null)?.data?.id;
    if (!id) return { ok: false, code: "provider_error", message: "X returned no post id.", retryable: true };
    return { ok: true, externalId: id, url: `https://x.com/i/status/${id}`, providerStatus: "PUBLISHED", raw: res.json };
  },

  async fetchMetrics(input) {
    const res = await http(`${API}/tweets/${encodeURIComponent(input.externalId)}?tweet.fields=public_metrics,created_at`, { headers: { Authorization: `Bearer ${input.accessToken}` } });
    if (res.status !== 200) return { ok: false, ...mapHttpError(res.status, res.headers, res.json ?? res.text, "X") };
    const m = (res.json as { data?: { public_metrics?: Record<string, number> } } | null)?.data?.public_metrics;
    if (!m) return { ok: false, code: "not_found", message: "X returned no metrics for that post." };
    return { ok: true, endpoint: "tweets/:id public_metrics", measuredAt: new Date(), metrics: { impressions: m.impression_count ?? null, likes: m.like_count ?? null, comments: m.reply_count ?? null, shares: (m.retweet_count ?? 0) + (m.quote_count ?? 0) }, raw: m };
  },
};

/**
 * Split text longer than one post into a thread: by paragraph, then sentence,
 * then word, never cutting a word and never exceeding the limit.
 */
export function splitThread(text: string, limit = 280): string[] {
  const out: string[] = [];
  const pushPiece = (piece: string) => {
    if (piece.length <= limit) return out.push(piece);
    let line = "";
    for (const word of piece.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (next.length <= limit) line = next;
      else {
        if (line) out.push(line);
        line = word.slice(0, limit);
      }
    }
    if (line) out.push(line);
  };
  for (const para of text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)) {
    if (para.length <= limit) {
      pushPiece(para);
      continue;
    }
    let buf = "";
    for (const sentence of para.split(/(?<=[.!?])\s+/)) {
      const next = buf ? `${buf} ${sentence}` : sentence;
      if (next.length <= limit) buf = next;
      else {
        if (buf) out.push(buf);
        buf = "";
        if (sentence.length <= limit) buf = sentence;
        else pushPiece(sentence);
      }
    }
    if (buf) out.push(buf);
  }
  return out;
}

/** Post a thread: each post replies to the previous. Stops at the first failure and reports how far it got. */
export async function publishThread(accessToken: string, posts: string[], replyTo?: string): Promise<{ ok: true; ids: string[] } | { ok: false; posted: string[]; message: string }> {
  const ids: string[] = replyTo ? [replyTo] : [];
  const start = ids.length;
  for (const text of posts) {
    const res = await http(`${API}/tweets`, { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ text: text.slice(0, 280), ...(ids.length ? { reply: { in_reply_to_tweet_id: ids[ids.length - 1] } } : {}) }) });
    const id = res.status === 201 ? (res.json as { data?: { id?: string } } | null)?.data?.id : undefined;
    if (!id) return { ok: false, posted: ids.slice(start), message: mapHttpError(res.status, res.headers, res.json ?? res.text, "X").message };
    ids.push(id);
  }
  return { ok: true, ids: ids.slice(start) };
}
