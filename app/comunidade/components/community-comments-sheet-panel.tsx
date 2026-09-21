import { forwardRef, type CSSProperties, type ReactNode } from "react";

type CommunityCommentsSheetPanelProps = {
  isDesktop: boolean;
  expanded: boolean;
  children: ReactNode;
};

export const CommunityCommentsSheetPanel = forwardRef<
  HTMLElement,
  CommunityCommentsSheetPanelProps
>(function CommunityCommentsSheetPanel(
  { isDesktop, expanded, children },
  ref
) {
  return (
    <article
      ref={ref}
      style={
        isDesktop
          ? desktopCommentsSheetStyle
          : {
              ...commentsSheetStyle,
              ...(expanded
                ? commentsSheetExpandedStyle
                : commentsSheetCompactStyle),
            }
      }
    >
      {children}
    </article>
  );
});

const commentsSheetStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(720px, 100%)",
  maxHeight: "calc(100dvh - env(safe-area-inset-top) - 10px)",
  display: "grid",
  gridTemplateRows: "auto auto minmax(0, 1fr) auto auto auto",
  gap: "7px",
  padding: "5px 12px calc(10px + env(safe-area-inset-bottom))",
  borderRadius: "28px 28px 0 0",
  background: "var(--historietas-comunidade-bg-page, #000000)",
  border: "none",
  borderBottom: "none",
  boxShadow: "0 -24px 70px rgba(0,0,0,0.72)",
  pointerEvents: "auto",
  overflow: "hidden",
  boxSizing: "border-box",
  willChange: "height",
  transition: "height 220ms ease",
};

const commentsSheetCompactStyle: CSSProperties = {
  height: "min(64dvh, 540px)",
};

const commentsSheetExpandedStyle: CSSProperties = {
  height: "min(90dvh, 760px)",
};

const desktopCommentsSheetStyle: CSSProperties = {
  ...commentsSheetStyle,
  width: "min(800px, calc(100% - 40px))",
  height: "min(76dvh, 720px)",
};
