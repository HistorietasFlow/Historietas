import { ImageResponse } from "next/og";

export const alt =
  "Historietas — Leia, descubra e publique histórias originais";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background:
            "linear-gradient(135deg, #05010C 0%, #0B0318 52%, #16062B 100%)",
          color: "#FFFFFF",
          fontFamily:
            "Arial, Helvetica, ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 520,
            height: 520,
            top: -230,
            right: -120,
            display: "flex",
            borderRadius: 999,
            background: "rgba(124, 58, 237, 0.20)",
          }}
        />

        <div
          style={{
            position: "absolute",
            width: 420,
            height: 420,
            bottom: -260,
            left: -120,
            display: "flex",
            borderRadius: 999,
            background: "rgba(249, 115, 22, 0.10)",
          }}
        />

        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "72px 84px",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
            }}
          >
            <div
              style={{
                width: 92,
                height: 92,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 24,
                background: "#090311",
                border: "2px solid rgba(167, 139, 250, 0.48)",
                fontSize: 58,
                lineHeight: 1,
                fontWeight: 900,
                letterSpacing: "-0.08em",
              }}
            >
              H
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: 54,
                lineHeight: 1,
                fontWeight: 900,
                letterSpacing: "-0.045em",
              }}
            >
              historietas
            </div>
          </div>

          <div
            style={{
              maxWidth: 970,
              display: "flex",
              flexDirection: "column",
              gap: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 70,
                lineHeight: 1.02,
                fontWeight: 900,
                letterSpacing: "-0.055em",
              }}
            >
              Histórias para descobrir. Um espaço para publicar.
            </div>

            <div
              style={{
                display: "flex",
                maxWidth: 850,
                color: "#D8CFF0",
                fontSize: 28,
                lineHeight: 1.35,
                fontWeight: 600,
              }}
            >
              Leia e publique webnovels, fanfics, mangás e histórias originais.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "#A995D6",
              fontSize: 22,
              lineHeight: 1,
              fontWeight: 700,
            }}
          >
            <div style={{ display: "flex" }}>www.historietas.com.br</div>
            <div
              style={{
                display: "flex",
                padding: "12px 18px",
                borderRadius: 999,
                border: "1px solid rgba(167, 139, 250, 0.32)",
                background: "rgba(124, 58, 237, 0.12)",
              }}
            >
              Leia • Descubra • Publique
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}