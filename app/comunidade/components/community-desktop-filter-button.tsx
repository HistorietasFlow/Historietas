import type { CSSProperties, MouseEventHandler } from "react";

type CommunityDesktopFilterButtonProps = {
  expanded: boolean;
  onClick: MouseEventHandler<HTMLButtonElement>;
};

export function CommunityDesktopFilterButton({
  expanded,
  onClick,
}: CommunityDesktopFilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={desktopFilterButtonStyle}
      aria-label="Abrir filtros, ordenação e ações da comunidade"
      aria-expanded={expanded}
    >
      <span>Filtros</span>
      <span aria-hidden="true">+</span>
    </button>
  );
}

const desktopFilterButtonStyle: CSSProperties = {
  minHeight: "42px",
  padding: "0 16px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "transparent",
  color: "#FFFFFF",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  fontFamily: "inherit",
  fontSize: "12px",
  fontWeight: 900,
  cursor: "pointer",
  whiteSpace: "nowrap",
};
