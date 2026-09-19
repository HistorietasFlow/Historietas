import type { CSSProperties, ReactNode } from "react";

type CommunityPageContainerProps = {
  children: ReactNode;
  style: CSSProperties;
};

export function CommunityPageContainer({
  children,
  style,
}: CommunityPageContainerProps) {
  return <main style={style}>{children}</main>;
}
