import type { CSSProperties } from "react";
import { containerStyle } from "./painel-autor-layout-style-utils";
import { statsBoxStyle, studioControlsStyle } from "./painel-autor-summary-style-utils";
import {
  sectionStyle,
  workCardStyle,
  workContentStyle,
  worksGridStyle,
} from "./painel-autor-work-card-layout-style-utils";
import { sheetStatsRowStyle } from "./painel-autor-work-card-stats-style-utils";
import { actionsGridStyle } from "./painel-autor-work-actions-style-utils";

export const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 64px))",
  padding: "34px 0 36px",
};

export const desktopStatsBoxStyle: CSSProperties = {
  ...statsBoxStyle,
  display: "grid",
  gridTemplateColumns: "repeat(8, minmax(0, 1fr))",
  gap: "10px",
  marginTop: "0",
};

export const desktopStudioControlsStyle: CSSProperties = {
  ...studioControlsStyle,
  width: "min(860px, 100%)",
  margin: "10px auto 0",
  gap: "8px",
};

export const desktopSectionStyle: CSSProperties = {
  ...sectionStyle,
  marginTop: "12px",
};

export const desktopWorksGridStyle: CSSProperties = {
  ...worksGridStyle,
  gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
  columnGap: "12px",
  rowGap: "18px",
};

export const desktopWorkCardStyle: CSSProperties = {
  ...workCardStyle,
};

export const desktopWorkContentStyle: CSSProperties = {
  ...workContentStyle,
  padding: "28px 42px 9px 10px",
};

export const desktopSheetStatsRowStyle: CSSProperties = {
  ...sheetStatsRowStyle,
  padding: "10px 22px 16px",
  gap: "14px",
};

export const desktopCardActionsGridStyle: CSSProperties = {
  ...actionsGridStyle,
};
