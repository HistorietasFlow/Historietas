import type { CSSProperties, ReactNode } from "react";

type CommunityMainLayoutProps = {
  children: ReactNode;
  isDesktop: boolean;
};

export function CommunityMainLayout({
  children,
  isDesktop,
}: CommunityMainLayoutProps) {
  return (
    <section style={isDesktop ? desktopLayoutStyle : layoutStyle}>
      {children}
    </section>
  );
}

const layoutStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  marginTop: "6px",
};

const desktopLayoutStyle: CSSProperties = {
  ...layoutStyle,
  width: "100%",
  gridTemplateColumns: "minmax(0, 1fr)",
  justifyItems: "stretch",
  gap: "18px",
  marginTop: 0,
};
