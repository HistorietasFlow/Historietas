import type { ReactNode } from "react";
import {
  authorCommunityPostDateStyle,
  authorCommunityPostHeaderStyle,
  authorCommunityPostTypeStyle,
} from "../styles";

type ProfileCommunityPostHeaderProps = {
  typeLabel: ReactNode;
  dateLabel: ReactNode;
};

export function ProfileCommunityPostHeader({
  typeLabel,
  dateLabel,
}: ProfileCommunityPostHeaderProps) {
  return (
    <span style={authorCommunityPostHeaderStyle}>
      <strong style={authorCommunityPostTypeStyle}>{typeLabel}</strong>
      <span style={authorCommunityPostDateStyle}>{dateLabel}</span>
    </span>
  );
}
