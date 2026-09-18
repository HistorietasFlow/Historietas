import type { ReactNode } from "react";
import { diarySummarySectionStyle } from "../styles";

type ProfileDiarySummarySectionProps = {
  children: ReactNode;
};

export function ProfileDiarySummarySection({
  children,
}: ProfileDiarySummarySectionProps) {
  return <section style={diarySummarySectionStyle}>{children}</section>;
}
