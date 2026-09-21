import type { ComponentPropsWithoutRef, CSSProperties } from "react";

type CommunitySearchInputProps = Omit<
  ComponentPropsWithoutRef<"input">,
  "style"
>;

export function CommunitySearchInput(
  inputProps: CommunitySearchInputProps
) {
  return <input {...inputProps} style={searchInputStyle} />;
}

const searchInputStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  flex: "1 1 auto",
  width: "100%",
  minWidth: 0,
  height: "34px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  outline: "none",
  fontFamily: "inherit",
  fontSize: "14px",
  fontWeight: 800,
  letterSpacing: "-0.025em",
  boxSizing: "border-box",
};
