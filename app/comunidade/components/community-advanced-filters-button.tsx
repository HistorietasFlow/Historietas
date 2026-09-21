import type { ComponentPropsWithoutRef, CSSProperties } from "react";

type CommunityAdvancedFiltersButtonProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "style"
>;

export function CommunityAdvancedFiltersButton({
  children,
  ...buttonProps
}: CommunityAdvancedFiltersButtonProps) {
  return (
    <button {...buttonProps} style={advancedFiltersButtonStyle}>
      {children}
    </button>
  );
}

const advancedFiltersButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "8px",
  minWidth: 0,
  maxWidth: "46%",
  flex: "0 1 auto",
  fontSize: "16px",
  lineHeight: 1.15,
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  textAlign: "left",
  letterSpacing: "-0.04em",
  boxShadow: "none",
  outline: "none",
  whiteSpace: "nowrap",
  WebkitTapHighlightColor: "transparent",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};
