import type { CSSProperties, SelectHTMLAttributes } from "react";

type CommunityPostComposerSelectProps =
  SelectHTMLAttributes<HTMLSelectElement>;

export function CommunityPostComposerSelect({
  children,
  ...selectProps
}: CommunityPostComposerSelectProps) {
  return (
    <select {...selectProps} style={selectStyle}>
      {children}
    </select>
  );
}

const selectStyle: CSSProperties = {
  width: "100%",
  minHeight: "38px",
  borderRadius: "15px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "var(--historietas-comunidade-bg-deep, #000000)",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "0 12px",
  outline: "none",
  fontSize: "13px",
  fontWeight: 750,
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
  cursor: "pointer",
};
