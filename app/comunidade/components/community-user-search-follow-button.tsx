import type { CSSProperties, ReactNode } from "react";

type CommunityUserSearchFollowButtonProps = {
  following: boolean;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
};

export function CommunityUserSearchFollowButton({
  following,
  disabled,
  onClick,
  children,
}: CommunityUserSearchFollowButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={
        following
          ? communityUserSearchFollowingButtonStyle
          : communityUserSearchFollowButtonStyle
      }
    >
      {children}
    </button>
  );
}

const communityUserSearchFollowButtonStyle: CSSProperties = {
  minWidth: "76px",
  minHeight: "34px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.16))",
  background: "var(--historietas-accent, #FFFFFF)",
  color: "#FFFFFF",
  padding: "0 12px",
  fontSize: "10.5px",
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const communityUserSearchFollowingButtonStyle: CSSProperties = {
  ...communityUserSearchFollowButtonStyle,
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.08))",
  color: "var(--historietas-text-primary, #FFFFFF)",
};
