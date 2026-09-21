import type { CSSProperties, ReactNode } from "react";

type CommunityPostComposerErrorMessageProps = {
  children: ReactNode;
};

export function CommunityPostComposerErrorMessage({
  children,
}: CommunityPostComposerErrorMessageProps) {
  return <span style={errorMessageStyle}>{children}</span>;
}

const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const errorMessageStyle: CSSProperties = {
  display: "block",
  padding: "9px 11px",
  borderRadius: "15px",
  background:
    "var(--historietas-danger-surface, var(--historietas-comunidade-danger-bg-12, rgba(255,255,255,0.08)))",
  border:
    "1px solid var(--historietas-comunidade-danger-24, rgba(255,255,255,0.12))",
  color:
    "var(--historietas-danger-button-text, var(--historietas-comunidade-danger-text, #FFFFFF))",
  fontSize: "12px",
  fontWeight: 850,
  textAlign: "center",
  ...safeTextStyle,
};
