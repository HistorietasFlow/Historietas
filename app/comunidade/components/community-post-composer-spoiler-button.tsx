import type { CSSProperties, ReactNode } from "react";

type CommunityPostComposerSpoilerButtonProps = {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
};

export function CommunityPostComposerSpoilerButton({
  active,
  disabled,
  onClick,
  children,
}: CommunityPostComposerSpoilerButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        ...(active ? spoilerButtonActiveStyle : spoilerButtonStyle),
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

const spoilerButtonStyle: CSSProperties = {
  minHeight: "39px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  padding: "0 10px 0 12px",
  borderRadius: "999px",
  background: "var(--historietas-comunidade-surface, #050505)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 900,
  fontFamily: "inherit",
  cursor: "pointer",
  width: "100%",
  maxWidth: "100%",
  textAlign: "center",
  boxSizing: "border-box",
  ...safeTextStyle,
};

const spoilerButtonActiveStyle: CSSProperties = {
  ...spoilerButtonStyle,
  background: "var(--historietas-comunidade-surface, #050505)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#FFFFFF",
};
