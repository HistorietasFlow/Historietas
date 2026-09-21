import type { CSSProperties, ReactNode } from "react";

type CommunityPostComposerPublishButtonProps = {
  disabled: boolean;
  children: ReactNode;
};

export function CommunityPostComposerPublishButton({
  disabled,
  children,
}: CommunityPostComposerPublishButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled}
      style={{
        ...publishButtonStyle,
        opacity: disabled ? 0.64 : 1,
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

const publishButtonStyle: CSSProperties = {
  minHeight: "39px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "var(--historietas-comunidade-surface, #050505)",
  color: "#FFFFFF",
  fontSize: "12.5px",
  fontWeight: 950,
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 14px",
  boxShadow: "none",
  cursor: "pointer",
  ...safeTextStyle,
};
