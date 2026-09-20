import type { CSSProperties, MouseEventHandler, ReactNode } from "react";
import { CommunitySheetRadioIndicator } from "./community-sheet-radio-indicator";

type CommunitySheetFilterOptionProps = {
  active: boolean;
  children: ReactNode;
  onClick: MouseEventHandler<HTMLButtonElement>;
};

export function CommunitySheetFilterOption({
  active,
  children,
  onClick,
}: CommunitySheetFilterOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={
        active
          ? communitySheetFilterOptionActiveStyle
          : communitySheetFilterOptionStyle
      }
    >
      <span>{children}</span>
      <CommunitySheetRadioIndicator active={active} />
    </button>
  );
}

const communitySheetFilterOptionStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  minHeight: "44px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  fontSize: "18px",
  lineHeight: 1,
  fontWeight: 650,
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

const communitySheetFilterOptionActiveStyle: CSSProperties = {
  ...communitySheetFilterOptionStyle,
  fontWeight: 900,
  background: "transparent",
};
