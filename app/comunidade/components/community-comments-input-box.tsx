import type { CSSProperties, ReactNode } from "react";

type CommunityCommentsInputBoxProps = {
  children: ReactNode;
};

export function CommunityCommentsInputBox({
  children,
}: CommunityCommentsInputBoxProps) {
  return <div style={inputBoxStyle}>{children}</div>;
}

const inputBoxStyle: CSSProperties = {
  minWidth: 0,
  minHeight: "38px",
  display: "flex",
  alignItems: "center",
};
