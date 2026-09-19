import type { CSSProperties, ReactNode } from "react";

type CommunityContentContainerProps = {
  children: ReactNode;
  isDesktop: boolean;
};

export function CommunityContentContainer({
  children,
  isDesktop,
}: CommunityContentContainerProps) {
  return (
    <section style={isDesktop ? desktopContainerStyle : containerStyle}>
      {children}
    </section>
  );
}

const containerStyle: CSSProperties = {
  position: "relative",
  width: "min(1120px, calc(100% - 24px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "4px 0 calc(20px + env(safe-area-inset-bottom))",
  boxSizing: "border-box",
  minWidth: 0,
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 64px))",
  maxWidth: "100%",
  padding: "34px 0 64px",
};
