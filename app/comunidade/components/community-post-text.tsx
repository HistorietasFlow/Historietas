import type { CSSProperties, ReactNode } from "react";

type CommunityPostTextProps = {
  children: ReactNode;
};

export function CommunityPostText({ children }: CommunityPostTextProps) {
  return (
    <p data-historietas-user-content="true" style={postTextStyle}>
      {children}
    </p>
  );
}

const postTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #F4F4F5)",
  fontSize: "13.5px",
  lineHeight: 1.55,
  fontWeight: 720,
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};
