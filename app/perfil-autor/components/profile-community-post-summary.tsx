import type { ReactNode } from "react";

import { authorCommunityPostTextStyle } from "../styles";

type ProfileCommunityPostSummaryProps = {
  children: ReactNode;
};

export function ProfileCommunityPostSummary({
  children,
}: ProfileCommunityPostSummaryProps) {
  return (
    <span
      data-historietas-user-content="true"
      style={authorCommunityPostTextStyle}
    >
      {children}
    </span>
  );
}
