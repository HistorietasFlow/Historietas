import type { ComponentPropsWithoutRef, CSSProperties } from "react";

type CommunityCommentsMentionButtonProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "style"
>;

export function CommunityCommentsMentionButton({
  children,
  ...buttonProps
}: CommunityCommentsMentionButtonProps) {
  return (
    <button {...buttonProps} style={mentionButtonStyle}>
      {children}
    </button>
  );
}

const mentionButtonStyle: CSSProperties = {
  width: "26px",
  height: "30px",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "16px",
  fontWeight: 950,
  fontFamily: "inherit",
  padding: 0,
  cursor: "pointer",
};
