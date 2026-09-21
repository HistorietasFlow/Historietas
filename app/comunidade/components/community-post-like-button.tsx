import type { CSSProperties, MouseEventHandler } from "react";

type CommunityPostLikeButtonProps = {
  onClick: MouseEventHandler<HTMLButtonElement>;
  disabled: boolean;
  liked: boolean;
  count: number;
  ariaLabel: string;
};

export function CommunityPostLikeButton({
  onClick,
  disabled,
  liked,
  count,
  ariaLabel,
}: CommunityPostLikeButtonProps) {
  return (
    <button
      type="button"
      data-historietas-community-like="post"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...postReactionButtonStyle,
        opacity: disabled ? 0.58 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      aria-pressed={liked}
      aria-label={ariaLabel}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={{
          ...postHeartIconStyle,
          animation: liked
            ? "historietas-comunidade-heart-pop 260ms ease-out"
            : "none",
        }}
      >
        <path
          d="M20.7 5.3c-1.8-1.9-4.7-1.9-6.5 0L12 7.6 9.8 5.3c-1.8-1.9-4.7-1.9-6.5 0-1.8 1.9-1.8 5 0 6.9L12 21l8.7-8.8c1.8-1.9 1.8-5 0-6.9Z"
          fill={liked ? "var(--historietas-comunidade-heart, #FFFFFF)" : "none"}
          stroke={liked ? "var(--historietas-comunidade-heart, #FFFFFF)" : "#FFFFFF"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span style={postReactionCountStyle}>{count}</span>
    </button>
  );
}

const actionButtonStyle: CSSProperties = {
  minHeight: "26px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "0",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 950,
  fontFamily: "inherit",
  padding: "0 4px",
  cursor: "pointer",
  minWidth: "0",
  textAlign: "center",
  whiteSpace: "nowrap",
  boxShadow: "none",
};

const postReactionButtonStyle: CSSProperties = {
  ...actionButtonStyle,
  gap: "4px",
};

const postHeartIconStyle: CSSProperties = {
  width: "18px",
  height: "18px",
  display: "block",
  flex: "0 0 auto",
  transformOrigin: "center",
};

const postReactionCountStyle: CSSProperties = {
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  fontSize: "12px",
  lineHeight: 1,
};
