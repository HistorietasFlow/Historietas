import type {
  ButtonHTMLAttributes,
  CSSProperties,
} from "react";

type CommunityPostComposerRelatedWorkSuggestionButtonProps =
  ButtonHTMLAttributes<HTMLButtonElement>;

export function CommunityPostComposerRelatedWorkSuggestionButton({
  children,
  ...buttonProps
}: CommunityPostComposerRelatedWorkSuggestionButtonProps) {
  return (
    <button {...buttonProps} style={relatedWorkSuggestionButtonStyle}>
      {children}
    </button>
  );
}

const relatedWorkSuggestionButtonStyle: CSSProperties = {
  minHeight: "58px",
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  padding: "12px 0",
  borderRadius: 0,
  border: "none",
  borderBottom: "1px solid rgba(255,255,255,0.10)",
  background: "transparent",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "inherit",
  cursor: "pointer",
  textAlign: "left",
  minWidth: 0,
  boxSizing: "border-box",
};
