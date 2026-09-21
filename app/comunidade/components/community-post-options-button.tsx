import type { ComponentPropsWithoutRef, CSSProperties } from "react";

type CommunityPostOptionsButtonProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "style"
> & {
  menuOpen: boolean;
};

export function CommunityPostOptionsButton({
  menuOpen,
  children,
  ...buttonProps
}: CommunityPostOptionsButtonProps) {
  return (
    <button
      {...buttonProps}
      style={menuOpen ? optionsButtonActiveStyle : optionsButtonStyle}
    >
      {children}
    </button>
  );
}

const optionsButtonStyle: CSSProperties = {
  width: "24px",
  height: "30px",
  borderRadius: 0,
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-primary, #FFFFFF)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "24px",
  fontWeight: 950,
  letterSpacing: 0,
  lineHeight: 1,
  fontFamily: "inherit",
  cursor: "pointer",
  padding: 0,
  position: "relative",
  zIndex: 2,
  boxShadow: "none",
};

const optionsButtonActiveStyle: CSSProperties = {
  ...optionsButtonStyle,
  opacity: 0,
  pointerEvents: "none",
};
