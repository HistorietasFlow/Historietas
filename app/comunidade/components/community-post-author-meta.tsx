import type { CSSProperties, ReactNode } from "react";

type CommunityPostAuthorMetaProps = {
  children: ReactNode;
};

export function CommunityPostAuthorMeta({
  children,
}: CommunityPostAuthorMetaProps) {
  return <div style={postMetaStyle}>{children}</div>;
}

const postMetaStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  minWidth: 0,
};
