import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const QUILL_SVG =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiI+CiAgPHBhdGggZmlsbD0iI2YwZDA3MCIgZD0iTTQ5Ni45MzggMTQuMDYzYy05NS4xNCAzLjQ5Ni0xNzIuMjk3IDI0LjA4LTIzMS4yODIgNTUuODEybC0yOS40NyA0OS4yOC00Ljk2Ny0yOC4wOTNjLTEwLjUzNSA3LjQwMi0yMC4zMTQgMTUuMjIyLTI5LjMxNCAyMy40MDdsLTE0LjY4NyA0NS4wNi01LjAzMi0yNS4xNTVjLTQwLjY1IDQ1LjUwNy02MC40MSA5OS44NjQtNTguOTM4IDE1NS45MDYgNDcuMjczLTkzLjY2NyAxMzIuNDA0LTE3Mi43MjcgMjExLjk3LTIyMS4xNTVsOS43MTcgMTUuOTdjLTc1LjMxMiA0NS44MzgtMTU2LjM4NyAxMjEuMjAyLTIwMi4xODcgMjA4LjI1aDEyLjE1NmMxOS43OC0xMi4wMiAzOS4xNi0yNi44NTggNTguNDA2LTQzLjQ0bC0zMC4yOCAxLjU5NSA1NC4yMTgtMjMuMDk0YzQ2Ljg3NS00My42MzcgOTMuNDY1LTk0Ljk3NCAxNDMuMzEzLTEzOC4yOGwtMjQuNDctNS4xOSA1Ni41LTIxLjAzYzI2Ljg1My0yMC40ODUgNTQuOC0zNy44NDQgODQuMzQ0LTQ5Ljg0M3pNNTkuNTMgMzEyLjAzdjMwLjQwOEgxOTRWMzEyLjAzSDU5LjUzem0yMC4zNzYgNDkuMDk1TDQ3LjI1IDM4OS44MTMgMjQuOTcgNDc0Ljc4bDE0LjUzIDE1Ljg3NmgxNzcuMjJsMTQuNTYtMTUuODc1TDIwOSAzODkuODE0bC0zMC45MDYtMjguNjg4SDc5LjkwNnoiLz4KPC9zdmc+Cg==";

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
          gap: 32,
          padding: 80,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={QUILL_SVG} width={120} height={120} alt="" />
        <span
          style={{
            color: "#f0d070",
            fontSize: 88,
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
