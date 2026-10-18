import type { CSSProperties } from "react";
import { socialTabsStyle, socialTabStyle } from "./seguindo-social-toolbar-styles";
import { sectionHeaderTextStyle, sectionTitleStyle, sectionCounterStyle } from "./seguindo-section-header-styles";

export const desktopSocialTabsStyle: CSSProperties = {
  ...socialTabsStyle,
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  alignItems: "stretch",
  gap: "8px",
  paddingBottom: "1px",
};

export const desktopSocialTabStyle: CSSProperties = {
  ...socialTabStyle,
  minHeight: "48px",
  padding: "0 12px 11px",
  fontSize: "13px",
  overflow: "visible",
  textOverflow: "clip",
};

export const desktopSocialTabActiveStyle: CSSProperties = {
  ...desktopSocialTabStyle,
  color: "#FFFFFF",
  borderBottom: "2px solid #FFFFFF",
};

export const desktopSectionHeaderTextStyle: CSSProperties = {
  ...sectionHeaderTextStyle,
  justifyItems: "start",
  textAlign: "left",
};

export const desktopSectionTitleStyle: CSSProperties = {
  ...sectionTitleStyle,
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  fontSize: "22px",
  textAlign: "left",
};

export const desktopSectionCounterStyle: CSSProperties = {
  ...sectionCounterStyle,
  width: "34px",
  height: "34px",
  fontSize: "14px",
};
