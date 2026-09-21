import type { CSSProperties, ReactNode } from "react";

type CommunityCommentsErrorNoticeProps = {
  children: ReactNode;
};

export function CommunityCommentsErrorNotice({
  children,
}: CommunityCommentsErrorNoticeProps) {
  return <span style={commentsErrorNoticeStyle}>{children}</span>;
}

const commentsErrorNoticeStyle: CSSProperties = {
  display: "block",
  padding: "8px 10px",
  borderRadius: "14px",
  background:
    "var(--historietas-danger-surface, var(--historietas-comunidade-danger-bg-12, rgba(255,255,255,0.08)))",
  border:
    "1px solid var(--historietas-comunidade-danger-24, rgba(255,255,255,0.12))",
  color:
    "var(--historietas-danger-button-text, var(--historietas-comunidade-danger-text, #FFFFFF))",
  fontSize: "11px",
  fontWeight: 850,
  lineHeight: 1.35,
  textAlign: "center",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};
