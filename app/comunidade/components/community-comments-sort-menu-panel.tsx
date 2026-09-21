import type {
  ComponentPropsWithoutRef,
  CSSProperties,
} from "react";

type CommunityCommentsSortMenuPanelProps = Omit<
  ComponentPropsWithoutRef<"div">,
  "style"
>;

export function CommunityCommentsSortMenuPanel({
  children,
  ...props
}: CommunityCommentsSortMenuPanelProps) {
  return (
    <div {...props} style={commentsSortMenuPanelStyle}>
      {children}
    </div>
  );
}

const commentsSortMenuPanelStyle: CSSProperties = {
  position: "absolute",
  top: "calc(100% + 6px)",
  right: 0,
  zIndex: 12,
  width: "132px",
  maxWidth: "calc(100vw - 24px)",
  display: "grid",
  gap: 0,
  padding: "4px 8px",
  boxSizing: "border-box",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "var(--historietas-comunidade-menu-98, rgba(0,0,0,0.98))",
  boxShadow: "0 16px 36px rgba(0,0,0,0.48)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
};
