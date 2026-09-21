import type { CSSProperties, ReactNode } from "react";

type CommunityPostComposerSpoilerIndicatorProps = {
  active: boolean;
  children: ReactNode;
};

export function CommunityPostComposerSpoilerIndicator({
  active,
  children,
}: CommunityPostComposerSpoilerIndicatorProps) {
  return (
    <span
      aria-hidden="true"
      style={active ? spoilerIndicatorActiveStyle : spoilerIndicatorStyle}
    >
      {children}
    </span>
  );
}

const spoilerIndicatorStyle: CSSProperties = {
  width: "17px",
  height: "17px",
  borderRadius: "5px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.18))",
  background: "rgba(255,255,255,0.035)",
  color: "transparent",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
  fontSize: "13px",
  lineHeight: 1,
  fontWeight: 950,
};

const spoilerIndicatorActiveStyle: CSSProperties = {
  ...spoilerIndicatorStyle,
  border:
    "1px solid var(--historietas-comunidade-success-70, rgba(255,255,255,0.70))",
  background:
    "var(--historietas-comunidade-success-10, rgba(255,255,255,0.06))",
  color: "var(--historietas-comunidade-success, #FFFFFF)",
};
