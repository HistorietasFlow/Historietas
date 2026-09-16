import Link from "next/link";
import type { CSSProperties } from "react";
import { authorHighlightItemStyle } from "../styles";

type ProfileHighlightItemProps = {
  capaStyle: CSSProperties;
  href: string;
  titulo: string;
};

export function ProfileHighlightItem({
  capaStyle,
  href,
  titulo,
}: ProfileHighlightItemProps) {
  return (
    <Link href={href} style={authorHighlightItemStyle} aria-label={titulo}>
      <div style={capaStyle} />
    </Link>
  );
}
