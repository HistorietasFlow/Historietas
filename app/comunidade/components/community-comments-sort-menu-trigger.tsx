import type {
  ComponentPropsWithoutRef,
  CSSProperties,
} from "react";

type CommunityCommentsSortMenuTriggerProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "style"
>;

export function CommunityCommentsSortMenuTrigger({
  children,
  ...props
}: CommunityCommentsSortMenuTriggerProps) {
  return (
    <button {...props} style={commentsSortMenuTriggerStyle}>
      {children}
    </button>
  );
}

const commentsSortMenuTriggerStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "27px",
  lineHeight: 1,
  fontWeight: 500,
  fontFamily: "inherit",
  padding: "0 0 2px",
  cursor: "pointer",
};
