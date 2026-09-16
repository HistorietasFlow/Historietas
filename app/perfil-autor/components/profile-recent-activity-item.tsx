import Link from "next/link";
import {
  diaryTimelineDateStyle,
  diaryTimelineDotStyle,
  diaryTimelineItemStyle,
  diaryTimelineTextStyle,
} from "../styles";

type ProfileRecentActivityItemProps = {
  href: string;
  title: string;
  description: string;
  formattedDate: string;
};

export function ProfileRecentActivityItem({
  href,
  title,
  description,
  formattedDate,
}: ProfileRecentActivityItemProps) {
  return (
    <Link href={href} style={diaryTimelineItemStyle}>
      <span style={diaryTimelineDotStyle} aria-hidden="true" />
      <span style={diaryTimelineTextStyle}>
        <strong data-historietas-user-content="true">{title}</strong>
        {" — "}
        {description}
      </span>
      <span style={diaryTimelineDateStyle}>{formattedDate}</span>
    </Link>
  );
}
