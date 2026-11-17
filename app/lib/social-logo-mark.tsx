import { readFileSync } from "node:fs";
import { join } from "node:path";

const logo = readFileSync(join(process.cwd(), "public", "icon-192.png"));
const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

export function SocialLogoMark() {
  return (
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
        overflow: "hidden",
      }}
    >
      {/* next/og renders plain images with embedded sources. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoSrc} alt="" width={88} height={88} />
    </div>
  );
}
