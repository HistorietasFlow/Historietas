import type { CSSProperties } from "react";

export const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "12px",
  minWidth: 0,
  maxWidth: "100%"
};

export const desktopGridStyle: CSSProperties = {
  ...gridStyle,
  width: "100%",
  margin: "0 auto",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "16px",
  alignItems: "stretch",
};

export const authorsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "12px",
  minWidth: 0,
  maxWidth: "100%"
};

export const desktopAuthorsGridStyle: CSSProperties = {
  ...authorsGridStyle,
  width: "100%",
  margin: "0 auto",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "14px",
  alignItems: "stretch",
};
