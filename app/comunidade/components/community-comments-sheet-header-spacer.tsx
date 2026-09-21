import type { CSSProperties } from "react";

export function CommunityCommentsSheetHeaderSpacer() {
  return <span style={commentsSheetHeaderSpacerStyle} aria-hidden="true" />;
}

const commentsSheetHeaderSpacerStyle: CSSProperties = {
  width: "40px",
  height: "1px",
};
