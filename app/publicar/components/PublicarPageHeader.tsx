import Link from "next/link";
import {
  desktopHeaderTitleLinkStyle,
  desktopHeaderTitleTextStyle,
  desktopTitleHeaderStyle,
  headerTitleLinkStyle,
  headerTitleTextStyle,
  titleHeaderStyle,
} from "../lib/publicar-layout-styles";

type PublicarPageHeaderProps = {
  isDesktop: boolean;
  voltarHome: string;
  novaObra: string;
};

export function PublicarPageHeader({
  isDesktop,
  voltarHome,
  novaObra,
}: PublicarPageHeaderProps) {
  return (
    <header style={isDesktop ? desktopTitleHeaderStyle : titleHeaderStyle}>
      <Link
        href="/"
        style={isDesktop ? desktopHeaderTitleLinkStyle : headerTitleLinkStyle}
        aria-label={voltarHome}
      >
        <span
          className="historietas-theme-title"
          style={isDesktop ? desktopHeaderTitleTextStyle : headerTitleTextStyle}
        >
          {novaObra}
        </span>
      </Link>
    </header>
  );
}
