import type {
  ComponentPropsWithoutRef,
  CSSProperties,
} from "react";

type CommunityCommentsSortMenuItemProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "style"
> & {
  active: boolean;
};

export function CommunityCommentsSortMenuItem({
  active,
  children,
  ...props
}: CommunityCommentsSortMenuItemProps) {
  return (
    <button
      {...props}
      style={
        active
          ? commentsSortMenuItemActiveStyle
          : commentsSortMenuItemStyle
      }
    >
      {children}
    </button>
  );
}

const commentsSortMenuItemStyle: CSSProperties = {
  width: "100%",
  minHeight: "36px",
  border: "none",
  borderRadius: 0,
  background: "transparent",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  padding: "0 4px",
  textAlign: "center",
  fontSize: "11.5px",
  fontWeight: 850,
  fontFamily: "inherit",
  cursor: "pointer",
};

const commentsSortMenuItemActiveStyle: CSSProperties = {
  ...commentsSortMenuItemStyle,
  color: "#FFFFFF",
};
