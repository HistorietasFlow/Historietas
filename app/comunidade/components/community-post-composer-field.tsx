import type { CSSProperties, ReactNode } from "react";

type CommunityPostComposerFieldProps = {
  children: ReactNode;
};

export function CommunityPostComposerField({
  children,
}: CommunityPostComposerFieldProps) {
  return <label style={fieldStyle}>{children}</label>;
}

const fieldStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  minWidth: 0,
};
