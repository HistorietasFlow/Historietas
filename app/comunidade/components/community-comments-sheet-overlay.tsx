import type { CSSProperties, ReactNode } from "react";

type CommunityCommentsSheetOverlayProps = {
  children: ReactNode;
};

export function CommunityCommentsSheetOverlay({
  children,
}: CommunityCommentsSheetOverlayProps) {
  return (
    <section
      data-historietas-comunidade-sheet="true"
      style={commentsSheetOverlayStyle}
      aria-label="Comentários"
    >
      {children}
    </section>
  );
}

const commentsSheetOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 9999,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  pointerEvents: "none",
  isolation: "isolate",
};
