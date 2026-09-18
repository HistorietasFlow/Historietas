import type { ReactNode } from "react";
import {
  authorCommunityIntroStyle,
  authorCommunityTitleStyle,
} from "../styles";

type ProfileCommunityHeaderProps = {
  title: ReactNode;
};

export function ProfileCommunityHeader({
  title,
}: ProfileCommunityHeaderProps) {
  return (
    <div style={authorCommunityIntroStyle}>
      <h2 style={authorCommunityTitleStyle}>{title}</h2>
    </div>
  );
}
