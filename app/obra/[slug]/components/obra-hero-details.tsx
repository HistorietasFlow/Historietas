import Link from "next/link";

import { desktopDescriptionStyle, desktopHeroAuthorStyle, desktopHeroKickerStyle, desktopHeroMetaDividerStyle, desktopHeroMetaStyle, desktopHeroMetaTextStyle, desktopTitleStyle, titleStyle } from "../lib/obra-style-utils";

type ObraHeroDetailsProps = { isDesktop: boolean; titulo: string; autorNome: string; autorHref: string; autorBio: string; genero: string; classificacaoIndicativa: string; sinopse: string; };

export default function ObraHeroDetails({ isDesktop, titulo, autorNome, autorHref, autorBio, genero, classificacaoIndicativa, sinopse }: ObraHeroDetailsProps) {
  return <>
    <span data-obra-desktop-only="true" style={desktopHeroKickerStyle}>Obra em destaque</span>
    <h1 data-obra-responsive="title" data-historietas-i18n-ignore="true" className="historietas-theme-title" style={isDesktop ? desktopTitleStyle : titleStyle}>{titulo}</h1>
      <div data-obra-desktop-only="true" style={desktopHeroMetaStyle}>
        <Link href={autorHref} style={desktopHeroAuthorStyle} aria-label={`Abrir perfil do autor ${autorNome}`} title={autorBio || undefined}>Por{" "}<span data-historietas-i18n-ignore="true">{autorNome}</span></Link>
        <span style={desktopHeroMetaDividerStyle} aria-hidden="true" />
        <span style={desktopHeroMetaTextStyle}>{genero}</span>
        <span style={desktopHeroMetaDividerStyle} aria-hidden="true" />
        <span style={desktopHeroMetaTextStyle}>{classificacaoIndicativa}</span>
      </div>
      <p data-obra-desktop-only="true" data-historietas-i18n-ignore="true" style={desktopDescriptionStyle}>{sinopse || "Nenhuma sinopse informada."}</p>
  </>;
}
