import type { CSSProperties, MouseEventHandler, ReactNode } from "react";

type CommunitySheetVisibilityOptionProps = {
  active: boolean;
  children: ReactNode;
  disabled: boolean;
  onClick: MouseEventHandler<HTMLButtonElement>;
};

export function CommunitySheetVisibilityOption({
  active,
  children,
  disabled,
  onClick,
}: CommunitySheetVisibilityOptionProps) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={active}
      onClick={onClick}
      disabled={disabled}
      style={
        active
          ? communitySheetVisibilityOptionActiveStyle
          : communitySheetVisibilityOptionStyle
      }
    >
      <span>{children}</span>
      <span aria-hidden="true">{active ? "✓" : ""}</span>
    </button>
  );
}

const communitySheetVisibilityOptionStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  minHeight: "42px",
  border: "none",
  borderRadius: "12px",
  background: "transparent",
  color: "#FFFFFF",
  fontSize: "15px",
  lineHeight: 1,
  fontWeight: 850,
  letterSpacing: "-0.035em",
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  padding: "0 30px",
  textAlign: "left",
  boxSizing: "border-box",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const communitySheetVisibilityOptionActiveStyle: CSSProperties = {
  ...communitySheetVisibilityOptionStyle,
  background: "rgba(255,255,255,0.12)",
  color: "#FFFFFF",
};
