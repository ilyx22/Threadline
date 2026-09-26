import { createHash } from "node:crypto";

/**
 * Metrics CSV import (INT-05): the supported manual path while platform APIs
 * await review. Pure functions: parse (RFC 4180 quoting), detect which columns
 * mean what, and turn rows into snapshot candidates. Matching to publish
 * records and writing happen in the action, which previews before it commits.
 */
export const METRIC_KEYS = ["views", "impressions", "reach", "likes", "comments", "shares", "saves", "watchTimeSec", "avgViewSec", "retentionPct", "ctrPct"] as const;
export type MetricKey = (typeof METRIC_KEYS)[number];

const ALIASES: Record<MetricKey | "url" | "postId" | "date", string[]> = {
  url: ["url", "post url", "post link", "link", "permalink", "video url", "content url"],
  postId: ["post id", "id", "video id", "media id", "tweet id", "urn", "content id"],
  date: ["date", "captured", "as of", "day", "report date"],
  views: ["views", "video views", "plays", "view count"],
  impressions: ["impressions", "impression count"],
  reach: ["reach", "unique impressions", "accounts reached"],
  likes: ["likes", "reactions", "like count"],
  comments: ["comments", "comment count", "replies"],
  shares: ["shares", "reposts", "retweets", "share count"],
  saves: ["saves", "bookmarks"],
  watchTimeSec: ["watch time (seconds)", "watch time seconds", "total watch time (s)"],
  avgViewSec: ["average view duration (seconds)", "avg view duration", "average watch time"],
  retentionPct: ["retention", "average percentage viewed", "retention %"],
  ctrPct: ["ctr", "click-through rate", "impressions click-through rate (%)"],
};

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim() !== "")) rows.push(row);
  return rows;
}

export type Mapping = Partial<Record<MetricKey | "url" | "postId" | "date", number>>;

export function detectMapping(headers: string[]): { mapping: Mapping; ignored: string[] } {
  const mapping: Mapping = {};
  const norm = headers.map((h) => h.trim().toLowerCase());
  norm.forEach((h, i) => {
    for (const [key, aliases] of Object.entries(ALIASES) as [keyof Mapping, string[]][]) {
      if (mapping[key] === undefined && aliases.includes(h)) mapping[key] = i;
    }
  });
  const used = new Set(Object.values(mapping));
  return { mapping, ignored: headers.filter((_, i) => !used.has(i)) };
}

const number = (v: string | undefined) => {
  if (v === undefined) return null;
  const s = v.replace(/[,\s%]/g, "");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

export type Candidate = { line: number; url: string | null; postId: string | null; capturedAt: Date | null; metrics: Partial<Record<MetricKey, number>>; fingerprint: string; problem: string | null };

export function toCandidates(rows: string[][], mapping: Mapping): Candidate[] {
  return rows.slice(1).map((r, idx) => {
    const cell = (k: keyof Mapping) => (mapping[k] === undefined ? undefined : r[mapping[k]!]);
    const metrics: Partial<Record<MetricKey, number>> = {};
    for (const k of METRIC_KEYS) {
      const n = number(cell(k));
      if (n !== null) metrics[k] = k.endsWith("Pct") || k === "avgViewSec" ? n : Math.round(n);
    }
    const url = cell("url")?.trim() || null;
    const postId = cell("postId")?.trim() || null;
    const rawDate = cell("date")?.trim();
    const capturedAt = rawDate && !Number.isNaN(Date.parse(rawDate)) ? new Date(rawDate) : null;
    const problem = !url && !postId ? "No post URL or id to match on." : Object.keys(metrics).length === 0 ? "No metric values." : null;
    return { line: idx + 2, url, postId, capturedAt, metrics, fingerprint: createHash("sha256").update(JSON.stringify(r)).digest("hex").slice(0, 32), problem };
  });
}

/** Normalise a post URL so trivial differences (scheme, www, trailing slash, tracking query) still match. */
export function normaliseUrl(u: string | null | undefined): string | null {
  if (!u) return null;
  try {
    const x = new URL(u.trim());
    return `${x.hostname.replace(/^www\./, "").toLowerCase()}${x.pathname.replace(/\/+$/, "")}`;
  } catch {
    return null;
  }
}
