import type { ComponentPropsWithoutRef, CSSProperties } from "react";

type CommunitySearchToggleButtonProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "style"
>;

export function CommunitySearchToggleButton({
  children,
  ...buttonProps
}: CommunitySearchToggleButtonProps) {
  return (
    <button {...buttonProps} style={searchToggleButtonStyle}>
      {children}
    </button>
  );
}

const searchToggleButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "34px",
  height: "34px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  fontFamily: "inherit",
  fontSize: "24px",
  lineHeight: 1,
  fontWeight: 950,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  padding: 0,
  boxShadow: "none",
  flex: "0 0 auto",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
};
