import type {
  ComponentPropsWithoutRef,
  CSSProperties,
} from "react";

type CommunityCommentsSheetTitleProps = Omit<
  ComponentPropsWithoutRef<"strong">,
  "style"
>;

export function CommunityCommentsSheetTitle({
  children,
  ...props
}: CommunityCommentsSheetTitleProps) {
  return (
    <strong {...props} style={commentsSheetTitleStyle}>
      {children}
    </strong>
  );
}

const commentsSheetTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "14.5px",
  fontWeight: 950,
  textAlign: "center",
  letterSpacing: "-0.02em",
};
