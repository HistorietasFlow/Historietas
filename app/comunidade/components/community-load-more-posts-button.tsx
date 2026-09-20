import type { CSSProperties, ReactNode } from "react";

type CommunityLoadMorePostsButtonProps = {
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
};

export function CommunityLoadMorePostsButton({
  disabled,
  onClick,
  children,
}: CommunityLoadMorePostsButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...loadMorePostsButtonStyle,
        opacity: disabled ? 0.58 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

const loadMorePostsButtonStyle: CSSProperties = {
  minHeight: "38px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 16px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "var(--historietas-comunidade-surface, #050505)",
  color: "#FFFFFF",
  fontSize: "11.5px",
  fontWeight: 950,
  fontFamily: "inherit",
  textAlign: "center",
  boxShadow: "none",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};
