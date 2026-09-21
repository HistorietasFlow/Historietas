import type { CSSProperties, ReactNode } from "react";

type CommunityPostComposerSuggestionButtonProps = {
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
};

export function CommunityPostComposerSuggestionButton({
  disabled,
  onClick,
  children,
}: CommunityPostComposerSuggestionButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        ...suggestionButtonStyle,
        opacity: disabled ? 0.58 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const suggestionButtonStyle: CSSProperties = {
  minHeight: "31px",
  flex: "0 0 auto",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.07))",
  color: "var(--historietas-text, #FFFFFF)",
  padding: "0 10px",
  fontSize: "10px",
  lineHeight: 1.2,
  fontWeight: 900,
  fontFamily: "inherit",
  whiteSpace: "nowrap",
  boxShadow: "none",
  ...safeTextStyle,
};
