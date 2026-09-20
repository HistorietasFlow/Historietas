import type { CSSProperties } from "react";

export function CommunitySheetHandle() {
  return <div style={communitySheetHandleStyle} />;
}

const communitySheetHandleStyle: CSSProperties = {
  justifySelf: "center",
  width: "72px",
  height: "5px",
  borderRadius: "999px",
  background: "rgba(244,244,245,0.62)",
  margin: "0 auto 14px",
};
