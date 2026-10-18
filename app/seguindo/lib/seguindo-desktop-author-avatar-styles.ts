import type { CSSProperties } from "react";
import { authorAvatarStyle, desktopAuthorCardStyle } from "./seguindo-author-card-styles";

export const desktopAuthorAvatarStyle: CSSProperties = {
  ...authorAvatarStyle,
  width: "58px",
  height: "58px",
  borderRadius: "17px",
  fontSize: "25px",
};

export const desktopAuthorFollowedCardStyle: CSSProperties = {
  ...desktopAuthorCardStyle,
  gridTemplateColumns: "68px minmax(0, 1fr)",
  minHeight: "94px",
  padding: "12px",
};

export const desktopAuthorFollowedAvatarStyle: CSSProperties = {
  ...authorAvatarStyle,
  width: "68px",
  height: "68px",
  borderRadius: "20px",
  fontSize: "28px",
};
