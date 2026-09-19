import type { ReactNode } from "react";

import { profileAboutMetricLabelStyle } from "../styles";

type ProfileAboutMetricLabelProps = {
  children: ReactNode;
};

export function ProfileAboutMetricLabel({
  children,
}: ProfileAboutMetricLabelProps) {
  return <span style={profileAboutMetricLabelStyle}>{children}</span>;
}
