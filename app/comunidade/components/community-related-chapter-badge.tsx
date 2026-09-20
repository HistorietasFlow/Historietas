import type { CSSProperties, ReactNode } from "react";

type CommunityRelatedChapterBadgeProps = {
  children: ReactNode;
};

export function CommunityRelatedChapterBadge({
  children,
}: CommunityRelatedChapterBadgeProps) {
  return (
    <span style={relatedChapterBadgeStyle}>
      <span>CAPÍTULO&nbsp;</span>
      <span data-historietas-user-content="true">{children}</span>
    </span>
  );
}

const relatedChapterBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  fontWeight: 900,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  minWidth: 0,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};
