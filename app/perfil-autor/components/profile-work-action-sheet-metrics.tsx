import type { ReactNode } from "react";

import { workActionSheetMetricsStyle } from "../styles";

type ProfileWorkActionSheetMetricsProps = {
  children: ReactNode;
};

export function ProfileWorkActionSheetMetrics({
  children,
}: ProfileWorkActionSheetMetricsProps) {
  return <span style={workActionSheetMetricsStyle}>{children}</span>;
}
