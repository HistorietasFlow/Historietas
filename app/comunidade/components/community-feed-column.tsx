import type { CSSProperties, ReactNode } from "react";

type CommunityFeedColumnProps = {
  children: ReactNode;
  isDesktop: boolean;
};

export function CommunityFeedColumn({
  children,
  isDesktop,
}: CommunityFeedColumnProps) {
  return (
    <section style={isDesktop ? desktopFeedColumnStyle : feedColumnStyle}>
      {children}
    </section>
  );
}

const feedColumnStyle: CSSProperties = {
  width: "min(880px, 100%)",
  display: "grid",
  gap: "3px",
  minWidth: 0,
};

const desktopFeedColumnStyle: CSSProperties = {
  ...feedColumnStyle,
  width: "100%",
  maxWidth: "100%",
  gap: "12px",
};
