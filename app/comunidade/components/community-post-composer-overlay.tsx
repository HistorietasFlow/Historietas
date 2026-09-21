import type { CSSProperties, ReactNode } from "react";

type CommunityPostComposerOverlayProps = {
  children: ReactNode;
};

export function CommunityPostComposerOverlay({
  children,
}: CommunityPostComposerOverlayProps) {
  return (
    <section style={postComposerOverlayStyle} aria-label="Criar publicação">
      {children}
    </section>
  );
}

const postComposerOverlayStyle: CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  height: "100dvh",
  zIndex: 240,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  background: "rgba(0,0,0,0.68)",
  padding: 0,
  boxSizing: "border-box",
  overscrollBehavior: "none",
  touchAction: "none",
};
