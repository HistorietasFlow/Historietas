import type {
  ComponentPropsWithoutRef,
  CSSProperties,
} from "react";

type CommunityCommentsSortMenuContainerProps = Omit<
  ComponentPropsWithoutRef<"div">,
  "style"
>;

export function CommunityCommentsSortMenuContainer({
  children,
  ...props
}: CommunityCommentsSortMenuContainerProps) {
  return (
    <div {...props} style={commentsSortMenuContainerStyle}>
      {children}
    </div>
  );
}

const commentsSortMenuContainerStyle: CSSProperties = {
  position: "relative",
  width: "40px",
  height: "34px",
  justifySelf: "end",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
};
