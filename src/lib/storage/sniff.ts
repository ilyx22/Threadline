/**
 * Upload content checks and safe serving (SEC-02, FILE-03).
 *
 * The MIME type a browser declares for an upload is client input. Every upload
 * is checked against its first bytes before it is stored: the declared type
 * must be on the allowlist AND the bytes must look like that family. SVG and
 * HTML are never accepted, because a browser runs script inside them.
 *
 * When served, only raster images, video and audio render inline. Everything
 * else downloads as an attachment with a neutral type, and every file response
 * carries a sandboxing Content-Security-Policy, so a stored file can never run
 * script on the application origin.
 */

export type Family = "png" | "jpeg" | "gif" | "webp" | "isobmff" | "ebml" | "mp3" | "aac" | "wav" | "ogg" | "flac" | "pdf" | "zip" | "ole" | "text";

/** The allowlist: declared type → the byte families it may contain. */
export const ACCEPTED: Record<string, Family[]> = {
  "image/png": ["png"],
  "image/jpeg": ["jpeg"],
  "image/gif": ["gif"],
  "image/webp": ["webp"],
  "image/heic": ["isobmff"],
  "image/heif": ["isobmff"],
  "video/mp4": ["isobmff"],
  "video/quicktime": ["isobmff"],
  "video/x-m4v": ["isobmff"],
  "video/webm": ["ebml"],
  "video/x-matroska": ["ebml"],
  "audio/mpeg": ["mp3"],
  "audio/mp4": ["isobmff"],
  "audio/x-m4a": ["isobmff"],
  "audio/aac": ["aac", "isobmff"],
  "audio/wav": ["wav"],
  "audio/x-wav": ["wav"],
  "audio/wave": ["wav"],
  "audio/ogg": ["ogg"],
  "audio/webm": ["ebml"],
  "audio/flac": ["flac"],
  "application/pdf": ["pdf"],
  "text/plain": ["text"],
  "text/csv": ["text"],
  "text/markdown": ["text"],
  "application/json": ["text"],
  "application/msword": ["ole"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["zip"],
};

/** Types that may render in the browser tab; everything else downloads. */
const INLINE = new Set(["image/png", "image/jpeg", "image/gif", "image/webp", "video/mp4", "video/quicktime", "video/webm", "audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/aac", "audio/wav", "audio/x-wav", "audio/wave", "audio/ogg", "audio/webm", "audio/flac"]);

const startsWith = (b: Uint8Array, sig: number[], at = 0) => sig.every((v, i) => b[at + i] === v);
const ascii = (b: Uint8Array, at: number, len: number) => String.fromCharCode(...b.subarray(at, at + len));

/** Identify the byte family from the first bytes (at least 16 are needed; 4 KB is plenty). */
export function sniff(b: Uint8Array): Family | null {
  if (startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (startsWith(b, [0xff, 0xd8, 0xff])) return "jpeg";
  if (ascii(b, 0, 6) === "GIF87a" || ascii(b, 0, 6) === "GIF89a") return "gif";
  if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WEBP") return "webp";
  if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WAVE") return "wav";
  if (ascii(b, 4, 4) === "ftyp") return "isobmff";
  if (startsWith(b, [0x1a, 0x45, 0xdf, 0xa3])) return "ebml";
  if (ascii(b, 0, 3) === "ID3" || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0 && (b[1] & 0x06) !== 0)) return "mp3";
  if (b[0] === 0xff && (b[1] & 0xf6) === 0xf0) return "aac";
  if (ascii(b, 0, 4) === "OggS") return "ogg";
  if (ascii(b, 0, 4) === "fLaC") return "flac";
  if (ascii(b, 0, 5) === "%PDF-") return "pdf";
  if (startsWith(b, [0x50, 0x4b, 0x03, 0x04])) return "zip";
  if (startsWith(b, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return "ole";
  if (looksLikeText(b)) return "text";
  return null;
}

function looksLikeText(b: Uint8Array): boolean {
  if (b.length === 0) return false;
  if (b.includes(0)) return false;
  try {
    // fatal decoding rejects invalid UTF-8; a sequence cut at the end of the
    // sample is tolerated by trimming up to three trailing bytes.
    const dec = new TextDecoder("utf-8", { fatal: true });
    for (let trim = 0; trim <= 3; trim++) {
      try {
        dec.decode(b.subarray(0, b.length - trim));
        return !/^\s*<(?:!doctype|html|svg|script|\?xml)/i.test(new TextDecoder().decode(b.subarray(0, 256)));
      } catch {
        /* try a shorter sample */
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * The error message for an unacceptable upload, or null when it is fine.
 * `declared` is the browser's type; `head` the first bytes of the file.
 */
export function contentProblem(declared: string, head: Uint8Array): string | null {
  const type = declared.toLowerCase().split(";")[0].trim();
  if (type === "image/svg+xml" || type.includes("html") || type.includes("xml")) {
    return "SVG, HTML and XML files are not accepted, because they can carry script. Export the image as PNG or PDF.";
  }
  const families = ACCEPTED[type];
  if (!families) return `Files of type "${type || "unknown"}" are not accepted.`;
  const found = sniff(head);
  if (!found || !families.includes(found)) return `The file's contents do not match its type (${type}). Re-export it and try again.`;
  return null;
}

/** Response headers for serving a stored file. */
export function servingHeaders(mimeType: string | null, fileName: string | null, size: number): Record<string, string> {
  const type = (mimeType ?? "").toLowerCase();
  const inline = INLINE.has(type);
  const name = (fileName ?? "file").replace(/[\r\n"\\]/g, "_");
  const ascii = name.replace(/[^\x20-\x7e]/g, "_");
  return {
    "Content-Type": inline ? type : "application/octet-stream",
    "Content-Length": String(size),
    "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`,
    "Content-Security-Policy": "default-src 'none'; img-src 'self'; media-src 'self'; style-src 'unsafe-inline'; sandbox",
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Referrer-Policy": "no-referrer",
  };
}
