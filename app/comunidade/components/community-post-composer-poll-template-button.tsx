import type { CSSProperties, ReactNode } from "react";

type CommunityPostComposerPollTemplateButtonProps = {
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
};

export function CommunityPostComposerPollTemplateButton({
  disabled,
  onClick,
  children,
}: CommunityPostComposerPollTemplateButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        ...pollTemplateButtonStyle,
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

const pollTemplateButtonStyle: CSSProperties = {
  minHeight: "auto",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  padding: 0,
  fontSize: "10px",
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  boxShadow: "none",
  ...safeTextStyle,
};
