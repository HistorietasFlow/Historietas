import type { ReactNode } from "react";

import { profileAboutMetricCardStyle } from "../styles";

type ProfileAboutMetricCardProps = {
  children: ReactNode;
};

export function ProfileAboutMetricCard({
  children,
}: ProfileAboutMetricCardProps) {
  return <div style={profileAboutMetricCardStyle}>{children}</div>;
}
