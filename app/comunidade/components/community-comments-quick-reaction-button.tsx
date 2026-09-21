import type { ComponentPropsWithoutRef, CSSProperties } from "react";

type CommunityCommentsQuickReactionButtonProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "style"
>;

export function CommunityCommentsQuickReactionButton({
  children,
  ...buttonProps
}: CommunityCommentsQuickReactionButtonProps) {
  return (
    <button {...buttonProps} style={quickReactionButtonStyle}>
      {children}
    </button>
  );
}

const quickReactionButtonStyle: CSSProperties = {
  width: "30px",
  height: "28px",
  border: "none",
  borderRadius: "999px",
  background: "transparent",
  fontSize: "18px",
  lineHeight: 1,
  padding: 0,
  cursor: "pointer",
  flex: "0 0 auto",
};
