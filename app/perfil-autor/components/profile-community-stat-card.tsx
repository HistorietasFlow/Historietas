import Link from "next/link";
import type { ReactNode } from "react";
import {
  authorCommunityCardNumberStyle,
  authorCommunityCardStyle,
  authorCommunityCardTextStyle,
  authorCommunityCardTitleStyle,
} from "../styles";

type ProfileCommunityStatCardProps = {
  href: string;
  ariaLabel: string;
  value: ReactNode;
  title: ReactNode;
  description: ReactNode;
};

export function ProfileCommunityStatCard({
  href,
  ariaLabel,
  value,
  title,
  description,
}: ProfileCommunityStatCardProps) {
  return (
    <Link
      href={href}
      style={authorCommunityCardStyle}
      aria-label={ariaLabel}
    >
      <strong style={authorCommunityCardNumberStyle}>{value}</strong>
      <span style={authorCommunityCardTitleStyle}>{title}</span>
      <span style={authorCommunityCardTextStyle}>{description}</span>
    </Link>
  );
}
