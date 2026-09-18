import Link from "next/link";
import type { ReactNode } from "react";
import {
  diaryMainReadingLinkStyle,
  diaryMainTitleStyle,
  diaryTitleToolbarStyle,
} from "../styles";

type ProfileDiaryHeaderProps = {
  title: ReactNode;
  href: string;
  linkAriaLabel: string;
  linkTitle: string;
  linkLabel: ReactNode;
};

export function ProfileDiaryHeader({
  title,
  href,
  linkAriaLabel,
  linkTitle,
  linkLabel,
}: ProfileDiaryHeaderProps) {
  return (
    <div style={diaryTitleToolbarStyle}>
      <h2 style={diaryMainTitleStyle}>{title}</h2>

      <Link
        href={href}
        style={diaryMainReadingLinkStyle}
        aria-label={linkAriaLabel}
        title={linkTitle}
      >
        {linkLabel}
      </Link>
    </div>
  );
}
