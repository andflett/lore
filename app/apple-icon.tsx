import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0f0e0c",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "6px solid #5e3c0c",
        }}
      >
        <span
          style={{
            color: "#f0d070",
            fontSize: 108,
            fontFamily: "serif",
            fontWeight: 700,
            lineHeight: 1,
            marginTop: -4,
          }}
        >
          W
        </span>
      </div>
    ),
    { ...size },
  );
}
