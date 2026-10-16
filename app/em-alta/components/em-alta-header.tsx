import Link from "next/link";
import {
  desktopHeaderTitleLinkStyle,
  desktopHeaderTitleMarkStyle,
  desktopHeaderTitleTextStyle,
  desktopTitleHeaderStyle,
  headerTitleLinkStyle,
  headerTitleMarkStyle,
  headerTitleTextStyle,
  titleHeaderStyle,
} from "../lib/em-alta-ranking-visual-style-utils";

export function EmAltaHeader({
  isDesktop,
  titulo,
}: {
  isDesktop: boolean;
  titulo: string;
}) {
  return (
    <header style={isDesktop ? desktopTitleHeaderStyle : titleHeaderStyle}>
      <Link
        href="/"
        style={
          isDesktop ? desktopHeaderTitleLinkStyle : headerTitleLinkStyle
        }
        aria-label="Voltar para a Home"
      >
        <span
          className="historietas-em-alta-logo-mark"
          style={
            isDesktop ? desktopHeaderTitleMarkStyle : headerTitleMarkStyle
          }
        >
          H
        </span>
        <span
          className="historietas-em-alta-hero-title"
          style={
            isDesktop ? desktopHeaderTitleTextStyle : headerTitleTextStyle
          }
        >
          {titulo}
        </span>
      </Link>
    </header>
  );
}
