import type { ReactNode } from "react";

import { diaryCardCoverMetaStyle } from "../styles";

type ProfileWorkCoverMetricsProps = {
  children: ReactNode;
};

export function ProfileWorkCoverMetrics({
  children,
}: ProfileWorkCoverMetricsProps) {
  return <span style={diaryCardCoverMetaStyle}>{children}</span>;
}
