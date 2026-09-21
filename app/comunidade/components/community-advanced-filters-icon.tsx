import type { CSSProperties, ReactNode } from "react";

type CommunityAdvancedFiltersIconProps = {
  children: ReactNode;
};

export function CommunityAdvancedFiltersIcon({
  children,
}: CommunityAdvancedFiltersIconProps) {
  return (
    <span style={advancedFiltersIconStyle} aria-hidden="true">
      {children}
    </span>
  );
}

const advancedFiltersIconStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "21px",
  lineHeight: 1,
  fontWeight: 700,
  flex: "0 0 auto",
};
