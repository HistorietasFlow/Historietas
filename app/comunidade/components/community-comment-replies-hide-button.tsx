import type {
  ButtonHTMLAttributes,
  CSSProperties,
} from "react";

type CommunityCommentRepliesHideButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "style"
>;

export function CommunityCommentRepliesHideButton({
  children,
  ...buttonProps
}: CommunityCommentRepliesHideButtonProps) {
  return (
    <button {...buttonProps} style={commentRepliesHideButtonStyle}>
      {children}
    </button>
  );
}

const commentRepliesHideButtonStyle: CSSProperties = {
  width: "fit-content",
  marginLeft: "44px",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  fontWeight: 900,
  fontFamily: "inherit",
  padding: "1px 0",
  cursor: "pointer",
};
