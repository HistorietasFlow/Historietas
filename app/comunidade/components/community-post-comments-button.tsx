import type { CSSProperties, MouseEventHandler } from "react";

type CommunityPostCommentsButtonProps = {
  onClick: MouseEventHandler<HTMLButtonElement>;
  count: number;
  ariaLabel: string;
};

export function CommunityPostCommentsButton({
  onClick,
  count,
  ariaLabel,
}: CommunityPostCommentsButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={postReactionButtonStyle}
      aria-label={ariaLabel}
    >
      <span style={postReactionIconStyle} aria-hidden="true">
        💬
      </span>
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

const postReactionIconStyle: CSSProperties = {
  width: "14px",
  height: "14px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 14px",
  fontSize: "13px",
  lineHeight: 1,
};

const postReactionCountStyle: CSSProperties = {
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  fontSize: "12px",
  lineHeight: 1,
};
