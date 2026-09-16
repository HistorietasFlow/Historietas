import Link from "next/link";
import { authorHighlightsTopFiveButtonStyle } from "../styles";

type ProfileHighlightsEditLinkProps = {
  href: string;
};

export function ProfileHighlightsEditLink({
  href,
}: ProfileHighlightsEditLinkProps) {
  return (
    <Link
      href={href}
      style={authorHighlightsTopFiveButtonStyle}
      aria-label="Montar ou editar TOP 5"
    >
      +
    </Link>
  );
}
