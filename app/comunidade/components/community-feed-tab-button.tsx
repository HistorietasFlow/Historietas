import type { CSSProperties, ReactNode } from "react";

type CommunityFeedTabButtonProps = {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
};

export function CommunityFeedTabButton({
  active,
  children,
  onClick,
}: CommunityFeedTabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={active ? communityFeedTabActiveStyle : communityFeedTabStyle}
    >
      {children}
    </button>
  );
}

const communityFeedTabStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  flex: "0 0 auto",
  minHeight: "38px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.13)",
  background: "rgba(255,255,255,0.025)",
  color: "rgba(255,255,255,0.66)",
  padding: "0 16px",
  fontFamily: "inherit",
  fontSize: "14px",
  lineHeight: 1,
  fontWeight: 900,
  letterSpacing: "-0.025em",
  cursor: "pointer",
  whiteSpace: "nowrap",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
};

const communityFeedTabActiveStyle: CSSProperties = {
  ...communityFeedTabStyle,
  border: "1px solid #FFFFFF",
  background: "#FFFFFF",
  color: "#000000",
};
