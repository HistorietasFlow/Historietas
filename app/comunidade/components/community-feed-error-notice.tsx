import type { CSSProperties, ReactNode } from "react";

type CommunityFeedErrorNoticeProps = {
  children: ReactNode;
};

export function CommunityFeedErrorNotice({
  children,
}: CommunityFeedErrorNoticeProps) {
  return <span style={communityErrorNoticeStyle}>{children}</span>;
}

const communityErrorNoticeStyle: CSSProperties = {
  display: "block",
  padding: "10px 12px",
  borderRadius: "16px",
  background:
    "var(--historietas-danger-surface, var(--historietas-comunidade-danger-bg-12, rgba(255,255,255,0.08)))",
  border:
    "1px solid var(--historietas-comunidade-danger-24, rgba(255,255,255,0.12))",
  color:
    "var(--historietas-danger-button-text, var(--historietas-comunidade-danger-text, #FFFFFF))",
  fontSize: "12px",
  fontWeight: 850,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};
