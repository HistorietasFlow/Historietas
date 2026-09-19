import type { ReactNode } from "react";

import { profileAboutMetricsGridStyle } from "../styles";

type ProfileAboutMetricsGridProps = {
  children: ReactNode;
};

export function ProfileAboutMetricsGrid({
  children,
}: ProfileAboutMetricsGridProps) {
  return <div style={profileAboutMetricsGridStyle}>{children}</div>;
}
