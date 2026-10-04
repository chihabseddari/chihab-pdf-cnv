import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "64px",
          height: "64px",
          background: "#07111c",
          color: "#e0b56a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 34,
          border: "2px solid #e0b56a",
          fontFamily: "Georgia",
        }}
      >
        C
      </div>
    ),
    { ...size },
  );
}
