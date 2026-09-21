import type { ComponentPropsWithoutRef, CSSProperties } from "react";

type CommunityCommentsFormContainerProps = Omit<
  ComponentPropsWithoutRef<"form">,
  "style"
>;

export function CommunityCommentsFormContainer({
  children,
  ...formProps
}: CommunityCommentsFormContainerProps) {
  return (
    <form {...formProps} style={commentsFormStyle}>
      {children}
    </form>
  );
}

const commentsFormStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "30px minmax(0, 1fr) 28px 38px",
  alignItems: "center",
  gap: "7px",
  padding: "7px 0 0",
  minWidth: 0,
};
