import type { CSSProperties } from "react";

type CommunitySheetRadioIndicatorProps = {
  active: boolean;
};

export function CommunitySheetRadioIndicator({
  active,
}: CommunitySheetRadioIndicatorProps) {
  return (
    <span
      style={
        active
          ? communitySheetRadioIndicatorActiveStyle
          : communitySheetRadioIndicatorStyle
      }
    >
      {active ? "✓" : ""}
    </span>
  );
}

const communitySheetRadioIndicatorStyle: CSSProperties = {
  width: "23px",
  height: "23px",
  borderRadius: "999px",
  border: "2.5px solid rgba(161,161,170,0.72)",
  background: "transparent",
  color: "transparent",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
  boxSizing: "border-box",
  fontSize: "15px",
  lineHeight: 1,
  fontWeight: 900,
};

const communitySheetRadioIndicatorActiveStyle: CSSProperties = {
  ...communitySheetRadioIndicatorStyle,
  border: "2px solid #FFFFFF",
  background: "#FFFFFF",
  color: "#111111",
};
