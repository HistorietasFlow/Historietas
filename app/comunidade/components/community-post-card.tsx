import type { CSSProperties, ReactNode } from "react";

type CommunityPostCardProps = {
  isDesktop: boolean;
  children: ReactNode;
};

export function CommunityPostCard({
  isDesktop,
  children,
}: CommunityPostCardProps) {
  return (
    <article style={isDesktop ? postCardDesktopStyle : postCardStyle}>
      {children}
    </article>
  );
}

const postCardStyle: CSSProperties = {
  display: "grid",
  gap: "11px",
  padding: "14px 0",
  borderRadius: 0,
  background: "transparent",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "none",
  minWidth: 0,
  overflow: "visible",
};

const postCardDesktopStyle: CSSProperties = {
  ...postCardStyle,
  gap: "12px",
  padding: "16px",
  borderRadius: "20px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.025)",
  alignContent: "start",
  overflow: "visible",
};
