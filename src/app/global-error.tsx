"use client";

/**
 * Last-resort boundary. Replaces the whole document, so it carries its own
 * html/body and cannot rely on the app's stylesheet being applied.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en-GB">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B0D0F",
          color: "#F5F2EB",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        }}
      >
        <div style={{ maxWidth: 420, padding: 32, textAlign: "center" }}>
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#C8A96B",
              margin: 0,
            }}
          >
            Threadline
          </p>
          <h1 style={{ fontSize: 20, fontWeight: 500, margin: "16px 0 0" }}>
            Something went badly wrong
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "#9CA3AF", margin: "12px 0 0" }}>
            The application could not recover on its own. Reloading usually resolves it.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: "#F5F2EB",
              color: "#0B0D0F",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
          {error.digest ? (
            <p style={{ marginTop: 24, fontSize: 11, color: "#4B5563", fontFamily: "monospace" }}>
              Reference: {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
