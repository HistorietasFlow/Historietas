import type { CSSProperties } from "react";

type HomeSectionHeaderProps = {
  title: string;
  subtitle?: string;
};

export default function HomeSectionHeader({
  title,
}: HomeSectionHeaderProps) {
  return (
    <div style={sectionHeaderStyle}>
      <h2 style={sectionTitleStyle}>{title}</h2>
    </div>
  );
}

const sectionHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  justifyItems: "center",
  gap: "6px",
  marginBottom: "14px",
  maxWidth: "100%",
  minWidth: 0,
  textAlign: "center",
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "clamp(24px, 4vw, 30px)",
  lineHeight: 1.05,
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: 900,
  letterSpacing: "-0.035em",
  maxWidth: "100%",
  textAlign: "center",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};
