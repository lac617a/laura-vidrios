import { ImageResponse } from "next/og";

import { getSettings } from "@/lib/settings";

// Vista previa por defecto al compartir enlaces del sitio (los productos con foto usan la suya).
export const alt = "Espejos a la medida, con envío e instalación";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const { businessName } = await getSettings();

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        gap: 72,
        padding: "0 96px",
        background: "linear-gradient(135deg, #fbf9f5 0%, #efe8dd 100%)",
        color: "#2d2a26",
      }}
    >
      <div
        style={{
          width: 260,
          height: 380,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #ffffff 0%, #ece5d9 55%, #dcd2c3 100%)",
          boxShadow: "0 30px 60px -20px rgba(60, 50, 40, 0.45)",
          border: "6px solid #ffffff",
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 20, flex: 1 }}>
        <div
          style={{ fontSize: 30, letterSpacing: 8, textTransform: "uppercase", color: "#8a8178" }}
        >
          Espejos
        </div>
        <div style={{ fontSize: 76, fontWeight: 600, lineHeight: 1.05 }}>{businessName}</div>
        <div style={{ fontSize: 34, color: "#5f574f" }}>
          A la medida · Envío e instalación en Colombia
        </div>
      </div>
    </div>,
    size,
  );
}
