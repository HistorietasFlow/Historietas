import type { CSSProperties, ReactNode } from "react";

type CommunitySheetSurfaceProps = {
  children: ReactNode;
  role?: "menu";
};

export function CommunitySheetSurface({
  children,
  role,
}: CommunitySheetSurfaceProps) {
  return (
    <article role={role} style={communitySheetSurfaceStyle}>
      {children}
    </article>
  );
}

const communitySheetBaseStyle: CSSProperties = {
  position: "fixed",
  left: "50%",
  bottom: 0,
  transform: "translateX(-50%)",
  zIndex: 241,
  width: "min(820px, 100%)",
  maxHeight: "calc(100dvh - 116px)",
  display: "grid",
  gap: "0",
  padding: "8px 0 calc(104px + env(safe-area-inset-bottom))",
  borderRadius: "24px 24px 0 0",
  background: "var(--historietas-comunidade-bg-page, #000000)",
  border: "none",
  borderBottom: "none",
  overflowY: "auto",
  overflowX: "hidden",
  overscrollBehavior: "none",
  boxShadow: "0 -18px 50px rgba(0,0,0,0.38)",
  boxSizing: "border-box",
  touchAction: "none",
};

const communitySheetSurfaceStyle: CSSProperties = {
  ...communitySheetBaseStyle,
  maxHeight: "calc(100dvh - 190px)",
  padding: "8px 0 calc(18px + env(safe-area-inset-bottom))",
};
