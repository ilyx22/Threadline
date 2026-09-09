import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Threadline — you already have the expertise. We turn it into content people actually want to watch.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, background: "#F4EEE3", color: "#1F1D1A", fontFamily: "Georgia, serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 28, letterSpacing: 6, fontFamily: "monospace" }}>THREADLINE</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 84, lineHeight: 0.98, letterSpacing: -2, maxWidth: 900 }}>You already have the expertise.</div>
          <div style={{ fontSize: 34, lineHeight: 1.3, color: "#4F4A42", fontFamily: "sans-serif", maxWidth: 900 }}>We turn it into content people actually want to watch — and run the system around it.</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 22, color: "#7E776C", fontFamily: "sans-serif" }}>A managed content growth system for expert-led businesses</div>
          <div style={{ width: 420, height: 6, background: "#D9582A", borderRadius: 3 }} />
        </div>
      </div>
    ),
    { ...size },
  );
}
