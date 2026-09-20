import type { CSSProperties, MouseEventHandler, ReactNode } from "react";

type CommunitySheetDangerActionProps = {
  children: ReactNode;
  disabled: boolean;
  onClick: MouseEventHandler<HTMLButtonElement>;
};

export function CommunitySheetDangerAction({
  children,
  disabled,
  onClick,
}: CommunitySheetDangerActionProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...communitySheetDangerActionStyle,
        opacity: disabled ? 0.58 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

const communitySheetDangerActionStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  minHeight: "48px",
  border: "none",
  background: "transparent",
  color: "var(--historietas-comunidade-pink, #FFFFFF)",
  fontSize: "18px",
  lineHeight: 1,
  fontWeight: 900,
  letterSpacing: "-0.035em",
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "16px",
  padding: "0 30px",
  textAlign: "left",
  boxSizing: "border-box",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};
