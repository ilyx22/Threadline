import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Threadline — make the expertise that wins the work visible before the sales call.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The share card in the marketing palette: bone ground, ink type, one cobalt thread. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, background: "#F3F0E8", color: "#121316", fontFamily: "Georgia, serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 30, letterSpacing: 4 }}>
          Threadline
          <div style={{ width: 54, height: 6, background: "#1F3BD6", borderRadius: 3 }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 30, color: "#1F3BD6", fontStyle: "italic" }}>For expert-led B2B firms</div>
          <div style={{ fontSize: 80, lineHeight: 0.98, letterSpacing: -2, maxWidth: 1000 }}>Make the expertise that wins the work visible before the sales call.</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 22, color: "#6F747C", fontFamily: "sans-serif" }}>A managed authority system for expert-led firms</div>
          <div style={{ width: 420, height: 6, background: "#1F3BD6", borderRadius: 3 }} />
        </div>
      </div>
    ),
    { ...size },
  );
}
