import type { CSSProperties } from "react";
import { safeTextStyle } from "./seguindo-surface-styles";

export const authorNameStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "23px",
  lineHeight: 1,
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: 500,
  letterSpacing: "-0.01em",
  maxWidth: "100%",
  ...safeTextStyle,
};
