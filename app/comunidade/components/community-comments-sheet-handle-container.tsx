import type {
  ComponentPropsWithoutRef,
  CSSProperties,
} from "react";

type CommunityCommentsSheetHandleContainerProps = Omit<
  ComponentPropsWithoutRef<"div">,
  "style"
>;

export function CommunityCommentsSheetHandleContainer({
  children,
  ...props
}: CommunityCommentsSheetHandleContainerProps) {
  return (
    <div {...props} style={commentsSheetHandleContainerStyle}>
      {children}
    </div>
  );
}

const commentsSheetHandleContainerStyle: CSSProperties = {
  minHeight: "24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  touchAction: "none",
  cursor: "grab",
  willChange: "transform",
  outline: "none",
};
