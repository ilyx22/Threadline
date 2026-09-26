"use client";

import { abortUploadAction, completeUploadAction, startUploadAction, uploadPartTargetsAction } from "@/lib/actions/uploads";

/** Files above this go straight to storage (FILE-02); smaller ones use the form upload. */
export const DIRECT_THRESHOLD = 10 * 1024 * 1024;

const CONCURRENCY = 4;
const RETRIES = 3;

export type DirectUploadMeta = { category: string; title?: string; contentItemId?: string };

/**
 * Send a file to storage in parts, four at a time, retrying each part up to
 * three times, then ask the server to verify and record it. Returns the new
 * asset id. On failure the upload is aborted so no parts are left behind.
 */
export async function directUpload(orgSlug: string, file: File, meta: DirectUploadMeta, onProgress?: (fraction: number) => void, signal?: AbortSignal): Promise<string> {
  const started = await startUploadAction(orgSlug, { fileName: file.name, mimeType: file.type || "application/octet-stream", sizeBytes: file.size, ...meta });
  if (!started.ok) throw new Error(started.error);
  const { sessionId, partSize, partCount } = started.data;
  const done = new Map<number, string>();
  let sent = 0;

  try {
    for (let batchStart = 1; batchStart <= partCount; batchStart += 100) {
      const numbers = Array.from({ length: Math.min(100, partCount - batchStart + 1) }, (_, i) => batchStart + i);
      const targets = await uploadPartTargetsAction(orgSlug, sessionId, numbers);
      if (!targets.ok) throw new Error(targets.error);
      const queue = [...targets.data];
      const worker = async () => {
        for (let t = queue.shift(); t; t = queue.shift()) {
          const start = (t.partNumber - 1) * partSize;
          const blob = file.slice(start, start + t.bytes);
          let lastError: unknown;
          for (let attempt = 0; attempt < RETRIES; attempt++) {
            if (signal?.aborted) throw new Error("Upload cancelled.");
            try {
              const res = await fetch(t.url, { method: "PUT", body: blob, signal });
              const etag = res.headers.get("etag");
              if (!res.ok || !etag) throw new Error(`Part ${t.partNumber} failed (${res.status}).`);
              done.set(t.partNumber, etag);
              sent += t.bytes;
              onProgress?.(sent / file.size);
              lastError = null;
              break;
            } catch (e) {
              lastError = e;
              await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
            }
          }
          if (lastError) throw lastError instanceof Error ? lastError : new Error("A part failed to upload.");
        }
      };
      await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    }
    const parts = [...done.entries()].map(([partNumber, etag]) => ({ partNumber, etag }));
    const finished = await completeUploadAction(orgSlug, sessionId, parts);
    if (!finished.ok) throw new Error(finished.error);
    return finished.data.id;
  } catch (e) {
    await abortUploadAction(orgSlug, sessionId).catch(() => {});
    throw e;
  }
}
