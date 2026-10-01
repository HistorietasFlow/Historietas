import Link from "next/link";
import type { CSSProperties } from "react";
import { safeTextStyle } from "./lib/obra-style-utils";

const communityItemStyle: CSSProperties = {
  padding: "8px 6px",
  borderRadius: "14px",
  background: "var(--historietas-obra-bg-deep, #000000)",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "grid",
  gap: "3px",
  justifyItems: "center",
  textAlign: "center",
  minWidth: 0,
  color: "inherit",
  textDecoration: "none",
  cursor: "pointer",
  boxShadow: "none",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

const communityNumberStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "18px",
  lineHeight: 1,
  fontWeight: 950,
  ...safeTextStyle,
};

const communityLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "8.5px",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.035em",
  ...safeTextStyle,
};



export default function CommunityItem({
  numero,
  rotulo,
  href,
}: {
  numero: string;
  rotulo: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      style={communityItemStyle}
      aria-label={`Abrir ${rotulo} desta obra na Comunidade`}
    >
      <strong style={communityNumberStyle}>{numero}</strong>
      <span style={communityLabelStyle}>{rotulo}</span>
    </Link>
  );
}

