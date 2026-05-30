import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0f0e0c",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          padding: 80,
          border: "3px solid #5e3c0c",
        }}
      >
        <span
          style={{
            color: "#f0d070",
            fontSize: 96,
            fontFamily: "serif",
            fontWeight: 700,
            letterSpacing: "0.15em",
          }}
        >
          WYRDSCRIBE
        </span>
        <span
          style={{
            color: "#bab6aa",
            fontSize: 34,
            fontFamily: "serif",
            textAlign: "center",
            maxWidth: 800,
          }}
        >
          A local-first gaming companion that remembers your playthrough.
        </span>
      </div>
    ),
    { ...size },
  );
}
