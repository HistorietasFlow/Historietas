import type { CSSProperties, ReactNode } from "react";

type CommunityPostTypeBadgeProps = {
  isPoll: boolean;
  children: ReactNode;
};

export function CommunityPostTypeBadge({
  isPoll,
  children,
}: CommunityPostTypeBadgeProps) {
  return (
    <span
      data-historietas-user-content={isPoll ? "true" : undefined}
      style={isPoll ? pollPostInlineQuestionStyle : postTypeBadgeStyle}
    >
      {children}
    </span>
  );
}

const postTypeBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  fontWeight: 950,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const pollPostInlineQuestionStyle: CSSProperties = {
  ...postTypeBadgeStyle,
  color: "var(--historietas-text-primary, #FFFFFF)",
};
