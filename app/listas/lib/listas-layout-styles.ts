import type { CSSProperties } from "react";

export const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background: "#000000",
  color: "#FFFFFF",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  paddingBottom: "48px",
};


export const headerStyle: CSSProperties = {
  background: "#000000",
};

export const headerInnerStyle: CSSProperties = {
  width: "min(100%, 920px)",
  minHeight: "72px",
  margin: "0 auto",
  padding: "14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
};

export const pageTitleStyle: CSSProperties = {
  width: "100%",
  margin: 0,
  color: "#FFFFFF",
  fontSize: "clamp(20px, 4vw, 30px)",
  fontWeight: 900,
  letterSpacing: "-0.035em",
  lineHeight: 1.08,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  textAlign: "center",
};

export const controlsStyle: CSSProperties = {
  width: "min(100%, 920px)",
  margin: "0 auto",
  padding: "12px 14px 8px",
  display: "grid",
  gap: "10px",
  boxSizing: "border-box",
};

export const listDiaryControlsStyle: CSSProperties = {
  ...controlsStyle,
  padding: "5px 14px 8px",
};

export const desktopControlsStyle: CSSProperties = {
  ...controlsStyle,
  width: "min(1180px, calc(100% - 64px))",
  padding: "12px 0 10px",
};

export const desktopListDiaryControlsStyle: CSSProperties = {
  ...desktopControlsStyle,
  padding: "6px 0 10px",
};

export const tabsStyle: CSSProperties = {
  display: "flex",
  gap: "7px",
  overflowX: "auto",
  scrollbarWidth: "none",
  paddingBottom: "2px",
};

export const desktopTabsStyle: CSSProperties = {
  ...tabsStyle,
  width: "100%",
  justifyContent: "center",
  alignItems: "center",
  flexWrap: "wrap",
  overflowX: "visible",
  paddingBottom: "2px",
};

export const tabStyle: CSSProperties = {
  flex: "0 0 auto",
  minHeight: "38px",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "999px",
  background: "#000000",
  color: "rgba(255,255,255,0.68)",
  padding: "0 12px",
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
  fontSize: "12px",
  fontWeight: 850,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

export const tabActiveStyle: CSSProperties = {
  ...tabStyle,
  background: "#FFFFFF",
  color: "#090909",
  border: "1px solid #FFFFFF",
};

export const tabCountStyle: CSSProperties = {
  minWidth: "19px",
  height: "19px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 5px",
  background: "rgba(127,127,127,0.22)",
  fontSize: "10px",
  fontWeight: 950,
};






export const listSectionStyle: CSSProperties = {
  width: "min(100%, 920px)",
  margin: "0 auto",
  padding: "0 14px",
  boxSizing: "border-box",
};

export const desktopListSectionStyle: CSSProperties = {
  ...listSectionStyle,
  width: "min(1180px, calc(100% - 64px))",
  padding: 0,
};

export const rowsStyle: CSSProperties = {};

export const desktopWorksRowsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  columnGap: "22px",
  rowGap: "8px",
  alignItems: "start",
  minWidth: 0,
};

export const rowMainLinkStyle: CSSProperties = {
  minHeight: "104px",
  padding: "9px 0 9px 4px",
  display: "grid",
  gridTemplateColumns: "62px minmax(0, 1fr)",
  alignItems: "center",
  gap: "12px",
  color: "#FFFFFF",
  textDecoration: "none",
  boxSizing: "border-box",
  transition: "background 120ms ease",
};

export const rowAuthorLinkStyle: CSSProperties = {
  ...rowMainLinkStyle,
  gridColumn: "1 / -1",
  paddingRight: "4px",
};

export const rowTextStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: "5px",
};

export const rowTitleStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "clamp(16px, 3.3vw, 18px)",
  fontWeight: 500,
  letterSpacing: "-0.01em",
  lineHeight: 1.2,
  overflow: "hidden",
  textOverflow: "ellipsis",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
};

export const rowMetaStyle: CSSProperties = {
  color: "rgba(255,255,255,0.52)",
  fontSize: "14px",
  fontWeight: 450,
  lineHeight: 1.25,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export const rowDetailStyle: CSSProperties = {
  color: "rgba(255,255,255,0.72)",
  fontSize: "12px",
  fontWeight: 750,
  lineHeight: 1.3,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export const rowOptionsButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "40px",
  minHeight: "44px",
  alignSelf: "center",
  justifySelf: "stretch",
  margin: 0,
  padding: 0,
  border: "none",
  borderRadius: "999px",
  background: "transparent",
  color: "#FFFFFF",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  position: "relative",
  zIndex: 2,
};

export const moreOptionsStyle: CSSProperties = {
  minHeight: "20px",
  minWidth: "10px",
  display: "inline-flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "2.5px",
};

export const moreDotStyle: CSSProperties = {
  width: "3px",
  height: "3px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.92)",
  display: "block",
};

export const monthGroupStyle: CSSProperties = {
  marginBottom: "12px",
};

export const monthTitleStyle: CSSProperties = {
  margin: "14px 0 7px",
  color: "rgba(255,255,255,0.48)",
  fontSize: "11px",
  fontWeight: 950,
  letterSpacing: "0.08em",
};

export const stateStyle: CSSProperties = {
  minHeight: "300px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "9px",
  color: "#FFFFFF",
  textAlign: "center",
  padding: "30px 18px",
};

export const stateIconStyle: CSSProperties = {
  width: "48px",
  height: "48px",
  borderRadius: "999px",
  background: "#151515",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "20px",
  fontWeight: 950,
};

export const stateTextStyle: CSSProperties = {
  maxWidth: "430px",
  color: "rgba(255,255,255,0.58)",
  fontSize: "13px",
  fontWeight: 650,
  lineHeight: 1.45,
};

export const stateLinkStyle: CSSProperties = {
  marginTop: "5px",
  minHeight: "38px",
  padding: "0 15px",
  borderRadius: "999px",
  background: "#FFFFFF",
  color: "#090909",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 900,
};

export const loadMoreButtonStyle: CSSProperties = {
  width: "100%",
  minHeight: "48px",
  marginTop: "14px",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "14px",
  background: "#0B0B0B",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 900,
  cursor: "pointer",
};


export const actionMessageStyle: CSSProperties = {
  position: "sticky",
  top: "10px",
  zIndex: 40,
  width: "fit-content",
  maxWidth: "calc(100% - 28px)",
  margin: "8px auto 0",
  padding: "10px 14px",
  borderRadius: "999px",
  background: "#FFFFFF",
  color: "#090909",
  fontSize: "12px",
  fontWeight: 900,
  boxShadow: "0 10px 30px rgba(0,0,0,0.32)",
};

export const footerStyle: CSSProperties = {
  width: "min(100%, 920px)",
  margin: "28px auto 0",
  padding: "0 14px",
  color: "rgba(255,255,255,0.32)",
  fontSize: "10px",
  fontWeight: 750,
  textAlign: "center",
  boxSizing: "border-box",
};
