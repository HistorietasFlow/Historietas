import type {
  ButtonHTMLAttributes,
  CSSProperties,
} from "react";

type CommunityCommentLikeButtonProps =
  ButtonHTMLAttributes<HTMLButtonElement>;

export function CommunityCommentLikeButton({
  children,
  disabled,
  style,
  ...buttonProps
}: CommunityCommentLikeButtonProps) {
  return (
    <button
      type="button"
      data-historietas-community-like="comment"
      {...buttonProps}
      disabled={disabled}
      style={{
        ...commentLikeButtonStyle,
        ...style,
        opacity: disabled ? 0.58 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

const commentLikeButtonStyle: CSSProperties = {
  width: "28px",
  height: "28px",
  border: "none",
  borderRadius: "999px",
  background: "transparent",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  cursor: "pointer",
};
