import type {
  ButtonHTMLAttributes,
  CSSProperties,
} from "react";

type CommunityCommentRepliesToggleButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "style"
>;

export function CommunityCommentRepliesToggleButton({
  children,
  ...buttonProps
}: CommunityCommentRepliesToggleButtonProps) {
  return (
    <button {...buttonProps} style={commentRepliesToggleStyle}>
      <span style={commentRepliesLineStyle} />
      {children}
    </button>
  );
}

const commentRepliesToggleStyle: CSSProperties = {
  width: "fit-content",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
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

const commentRepliesLineStyle: CSSProperties = {
  width: "22px",
  height: "1px",
  background: "rgba(255,255,255,0.22)",
};
