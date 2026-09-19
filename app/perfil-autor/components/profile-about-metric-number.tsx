import type { ReactNode } from "react";

import { profileAboutMetricNumberStyle } from "../styles";

type ProfileAboutMetricNumberProps = {
  children: ReactNode;
};

export function ProfileAboutMetricNumber({
  children,
}: ProfileAboutMetricNumberProps) {
  return <strong style={profileAboutMetricNumberStyle}>{children}</strong>;
}
