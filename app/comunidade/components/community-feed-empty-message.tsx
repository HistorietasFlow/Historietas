import type { CSSProperties, ReactNode } from "react";

type CommunityFeedEmptyMessageProps = {
  children: ReactNode;
  desktop: boolean;
};

export function CommunityFeedEmptyMessage({
  children,
  desktop,
}: CommunityFeedEmptyMessageProps) {
  return (
    <p
      style={{
        ...feedEmptyMessageStyle,
        gridColumn: desktop ? "1 / -1" : undefined,
      }}
    >
      {children}
    </p>
  );
}

const feedEmptyMessageStyle: CSSProperties = {
  margin: "10px 0 0",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 800,
  textAlign: "center",
};
