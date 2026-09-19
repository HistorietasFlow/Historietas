import type { ReactNode } from "react";
import {
  authorCommunityPreviewIconStyle,
  authorCommunityPreviewStyle,
  authorCommunityPreviewTextBlockStyle,
  authorCommunityPreviewTextStyle,
  authorCommunityPreviewTitleStyle,
} from "../styles";

type ProfileCommunityNoticeProps = {
  icon: ReactNode;
  title: ReactNode;
  description: ReactNode;
};

export function ProfileCommunityNotice({
  icon,
  title,
  description,
}: ProfileCommunityNoticeProps) {
  return (
    <div style={authorCommunityPreviewStyle}>
      <span style={authorCommunityPreviewIconStyle}>{icon}</span>

      <div style={authorCommunityPreviewTextBlockStyle}>
        <strong style={authorCommunityPreviewTitleStyle}>{title}</strong>
        <p style={authorCommunityPreviewTextStyle}>{description}</p>
      </div>
    </div>
  );
}
