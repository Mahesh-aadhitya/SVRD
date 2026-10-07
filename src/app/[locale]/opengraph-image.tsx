import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// The link-preview card (WhatsApp, Telegram, Facebook…) for every page that
// doesn't make its own: the temple's chakram as the logo, with its name.
// The card's built-in font has no Kannada glyphs, so it is in English.
export const alt = "Sri Varadaraja Swamy Devasthaanam";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const chakram = await readFile(join(process.cwd(), "public/images/chakra-watermark.png"));
  const src = `data:image/png;base64,${chakram.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 56,
          padding: "0 80px",
          background: "linear-gradient(135deg, #fbf1de 0%, #f5e2bf 100%)",
          border: "14px solid #7a1f1f",
        }}
      >
        <img src={src} alt="" width={360} height={430} style={{ objectFit: "contain" }} />
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ fontSize: 30, letterSpacing: 6, color: "#a8771f", textTransform: "uppercase" }}>Kolar Fort · Kolar</div>
          <div style={{ marginTop: 14, fontSize: 70, lineHeight: 1.08, color: "#7a1f1f", fontWeight: 700 }}>
            Sri Varadaraja Swamy Devasthaanam
          </div>
          <div style={{ marginTop: 24, height: 4, width: 220, background: "#c9973a" }} />
          <div style={{ marginTop: 24, fontSize: 32, color: "#4a3a2a" }}>Sevas · Panchangam · Live darshan · Events</div>
        </div>
      </div>
    ),
    size,
  );
}
