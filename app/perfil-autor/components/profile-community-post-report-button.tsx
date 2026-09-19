import type { MouseEventHandler } from "react";

import { authorCommunityPostReportButtonStyle } from "../styles";

type ProfileCommunityPostReportButtonProps = {
  onClick: MouseEventHandler<HTMLButtonElement>;
};

export function ProfileCommunityPostReportButton({
  onClick,
}: ProfileCommunityPostReportButtonProps) {
  return (
    <button
      type="button"
      style={authorCommunityPostReportButtonStyle}
      onClick={onClick}
      aria-label="Denunciar publicação"
    >
      Denunciar
    </button>
  );
}
