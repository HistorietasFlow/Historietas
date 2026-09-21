import type {
  ComponentPropsWithoutRef,
  CSSProperties,
} from "react";

type CommunityCommentsSheetHeaderContainerProps = Omit<
  ComponentPropsWithoutRef<"header">,
  "style"
>;

export function CommunityCommentsSheetHeaderContainer({
  children,
  ...props
}: CommunityCommentsSheetHeaderContainerProps) {
  return (
    <header {...props} style={commentsSheetHeaderContainerStyle}>
      {children}
    </header>
  );
}

const commentsSheetHeaderContainerStyle: CSSProperties = {
  minHeight: "32px",
  display: "grid",
  gridTemplateColumns: "40px minmax(0, 1fr) 40px",
  alignItems: "center",
  gap: "6px",
  minWidth: 0,
};
