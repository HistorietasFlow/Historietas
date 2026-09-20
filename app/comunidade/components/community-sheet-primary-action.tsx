import type { CSSProperties, MouseEventHandler, ReactNode } from "react";

type CommunitySheetPrimaryActionProps = {
  children: ReactNode;
  onClick: MouseEventHandler<HTMLButtonElement>;
};

export function CommunitySheetPrimaryAction({
  children,
  onClick,
}: CommunitySheetPrimaryActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={communitySheetPrimaryActionStyle}
    >
      {children}
    </button>
  );
}

const communitySheetPrimaryActionStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  minHeight: "48px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
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
