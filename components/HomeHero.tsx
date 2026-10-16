"use client";

import Link from "next/link";
import type { Dispatch, SetStateAction } from "react";
import HomeHeroCarouselDots from "./HomeHeroCarouselDots";
import type { HistorietasLanguage } from "../lib/i18n";
import type { Obra } from "../app/lib/home-page-models";
import { heroDecorationLayerStyle } from "../app/lib/home-shell-header-styles";
import {
  desktopHeroAuthorStyle,
  desktopHeroButtonsStyle,
  desktopHeroClassificationStyle,
  desktopHeroContentStyle,
  desktopHeroDescriptionStyle,
  desktopHeroFooterStyle,
  desktopHeroGenreStyle,
  desktopHeroInitialButtonsStyle,
  desktopHeroKickerStyle,
  desktopHeroLoginNoticeStyle,
  desktopHeroMetaDividerStyle,
  desktopHeroMetaStyle,
  desktopHeroPosterFrameStyle,
  desktopHeroPosterGlowStyle,
  desktopHeroPosterStatusStyle,
  desktopHeroPosterTitleStyle,
  desktopHeroSaveButtonStyle,
  desktopHeroShellStyle,
  desktopHeroStatIconStyle,
  desktopHeroStatItemStyle,
  desktopHeroStatsStyle,
  desktopHeroStatValueStyle,
  desktopHeroStyle,
  desktopHeroTitleStyle,
  desktopPrimaryButtonStyle,
  desktopSecondaryButtonStyle,
  heroGlowStyle,
  heroLoginNoticeStyle,
  heroSaveButtonStyle,
  mobileHeroButtonsStyle,
  mobileHeroContentStyle,
  mobileHeroDescriptionStyle,
  mobileHeroFooterStyle,
  mobileHeroImageGlowStyle,
  mobileHeroInitialButtonsStyle,
  mobileHeroMetaStyle,
  mobileHeroPillStyle,
  mobileHeroStatIconStyle,
  mobileHeroStatItemStyle,
  mobileHeroStatsStyle,
  mobileHeroStatValueStyle,
  mobileHeroTextBlockStyle,
  mobileHeroTitleStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
} from "../app/lib/home-hero-layout-styles";
import { cardStatHeartIconStyle } from "../app/lib/home-work-card-styles";
import {
  traduzirClassificacaoHome,
  traduzirGeneroHome,
} from "../app/lib/home-metadata-utils";
import { formatarSinopseHeroMobile } from "../app/lib/home-hero-work-utils";
import { criarDesktopHeroPosterStyle } from "../app/lib/home-cover-hero-style-utils";
import {
  criarDecoracaoHomeStyle,
  criarMobileHeroFrameBackground,
  criarMobileHeroImageLayerStyle,
  heroStyle,
} from "../app/lib/home-hero-visual-style-utils";

type HeroMetricHome = {
  icone: string;
  valor: string;
  destaque?: boolean;
};

type HomeHeroProps = {
  isDesktop: boolean;
  language: HistorietasLanguage;
  obrasHero: Obra[];
  heroIndex: number;
  setHeroIndex: Dispatch<SetStateAction<number>>;
  usandoHeroInicial: boolean;
  heroObra: Obra;
  heroObraHref: string;
  heroTemImagem: boolean;
  heroEstaSalvo: boolean;
  avisoLogin: string;
  metricasHeroHome: HeroMetricHome[];
  desktopMetricasHeroHome: HeroMetricHome[];
  onToggleFavorite: () => unknown;
};

export default function HomeHero({
  isDesktop,
  language,
  obrasHero,
  heroIndex,
  setHeroIndex,
  usandoHeroInicial,
  heroObra,
  heroObraHref,
  heroTemImagem,
  heroEstaSalvo,
  avisoLogin,
  metricasHeroHome,
  desktopMetricasHeroHome,
  onToggleFavorite,
}: HomeHeroProps) {
  return (
    <section
      style={
        isDesktop
          ? {
              ...heroStyle,
              ...desktopHeroStyle,
            }
          : criarMobileHeroFrameBackground()
      }
    >
      {!isDesktop && (
        <div style={criarMobileHeroImageLayerStyle(heroObra)} aria-hidden="true" />
      )}

      {!isDesktop && (
        <div
          style={
            heroTemImagem
              ? mobileHeroImageGlowStyle
              : heroGlowStyle
          }
        />
      )}

      {!isDesktop && !heroTemImagem && (
        <div style={heroDecorationLayerStyle} aria-hidden="true">
          {["✦", "◌", "✧", "◇"].map((decoracao, index) => (
            <span key={`hero-${decoracao}-${index}`} style={criarDecoracaoHomeStyle()}>
              {decoracao}
            </span>
          ))}
        </div>
      )}

      {isDesktop ? (
        <div style={desktopHeroShellStyle}>
          <div style={desktopHeroPosterFrameStyle}>
            <Link
              href={heroObraHref}
              style={criarDesktopHeroPosterStyle(heroObra)}
              aria-label={`Abrir ${heroObra.titulo}`}
            >
              {!heroTemImagem && (
                <>
                  <span style={desktopHeroPosterGlowStyle} aria-hidden="true" />
                  <strong style={desktopHeroPosterTitleStyle}>{heroObra.titulo}</strong>
                  <span style={desktopHeroPosterStatusStyle}>
                    {heroObra.status || "Obra em destaque"}
                  </span>
                </>
              )}
            </Link>
          </div>

          <div style={desktopHeroContentStyle}>
            <span style={desktopHeroKickerStyle}>
              {usandoHeroInicial ? "Conheça o Historietas" : "Em destaque"}
            </span>

            <h1 className="historietas-home-hero-title" style={desktopHeroTitleStyle}>
              {heroObra.titulo}
            </h1>

            <div style={desktopHeroMetaStyle}>
              <span style={desktopHeroAuthorStyle}>
                Por {heroObra.autor || "Autor não informado"}
              </span>
              <span style={desktopHeroMetaDividerStyle} aria-hidden="true" />
              <span style={desktopHeroGenreStyle}>
                {traduzirGeneroHome(heroObra.genero, language)}
              </span>
              <span style={desktopHeroMetaDividerStyle} aria-hidden="true" />
              <span style={desktopHeroClassificationStyle}>
                {traduzirClassificacaoHome(heroObra.classificacaoIndicativa, language)}
              </span>
            </div>

            <p style={desktopHeroDescriptionStyle}>
              {heroObra.sinopse || "Nenhuma sinopse informada."}
            </p>

            <div style={usandoHeroInicial ? desktopHeroInitialButtonsStyle : desktopHeroButtonsStyle}>
              <Link href={heroObraHref} style={desktopPrimaryButtonStyle}>
                {usandoHeroInicial ? "Explorar obras" : "Ler agora"}
              </Link>

              {usandoHeroInicial && (
                <Link href="/publicar" style={desktopSecondaryButtonStyle}>
                  Publicar obra
                </Link>
              )}

              {!usandoHeroInicial && (
                <button
                  type="button"
                  onClick={onToggleFavorite}
                  aria-pressed={heroEstaSalvo}
                  style={desktopHeroSaveButtonStyle}
                >
                  {heroEstaSalvo ? "Salvo" : "Salvar"}
                </button>
              )}
            </div>

            {avisoLogin && <p style={desktopHeroLoginNoticeStyle}>{avisoLogin}</p>}

            {!usandoHeroInicial && (
              <div style={desktopHeroFooterStyle}>
                <div style={desktopHeroStatsStyle}>
                  {desktopMetricasHeroHome.map((metrica) => (
                    <span
                      key={`hero-desktop-${metrica.icone}`}
                      style={desktopHeroStatItemStyle}
                    >
                      <span
                        style={
                          metrica.destaque
                            ? cardStatHeartIconStyle
                            : desktopHeroStatIconStyle
                        }
                      >
                        {metrica.icone}
                      </span>
                      <span style={desktopHeroStatValueStyle}>
                        {metrica.valor}
                      </span>
                    </span>
                  ))}
                </div>

                <HomeHeroCarouselDots
                  obras={obrasHero}
                  activeIndex={heroIndex}
                  onSelect={setHeroIndex}
                  isDesktop={true}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={mobileHeroContentStyle}>
          <div style={mobileHeroMetaStyle}>
            <span style={mobileHeroPillStyle}>✦ {traduzirGeneroHome(heroObra.genero, language)}</span>
            <span style={mobileHeroPillStyle}>◆ {traduzirClassificacaoHome(heroObra.classificacaoIndicativa, language)}</span>
          </div>

          <div style={mobileHeroTextBlockStyle}>
            <h1
              className="historietas-home-hero-title"
              style={mobileHeroTitleStyle}
            >
              {heroObra.titulo}
            </h1>

            <p style={mobileHeroDescriptionStyle}>
              {formatarSinopseHeroMobile(heroObra.sinopse)}
            </p>
          </div>

          <div style={usandoHeroInicial ? mobileHeroInitialButtonsStyle : mobileHeroButtonsStyle}>
            <Link href={heroObraHref} style={primaryButtonStyle}>
              {usandoHeroInicial ? "Explorar obras" : "Ver obra"}
            </Link>

            {usandoHeroInicial && (
              <Link href="/publicar" style={secondaryButtonStyle}>
                Publicar obra
              </Link>
            )}

            {!usandoHeroInicial && (
              <button
              type="button"
              onClick={onToggleFavorite}
              aria-pressed={heroEstaSalvo}
              style={heroSaveButtonStyle}
            >
                {heroEstaSalvo ? "Salvo" : "Salvar"}
              </button>
            )}
          </div>

          {avisoLogin && <p style={heroLoginNoticeStyle}>{avisoLogin}</p>}

          {!usandoHeroInicial && (
            <div style={mobileHeroFooterStyle}>
              <div style={mobileHeroStatsStyle}>
                {metricasHeroHome.map((metrica) => (
                  <span
                    key={`hero-mobile-${metrica.icone}`}
                    style={mobileHeroStatItemStyle}
                  >
                    <span
                      style={
                        metrica.destaque
                          ? cardStatHeartIconStyle
                          : mobileHeroStatIconStyle
                      }
                    >
                      {metrica.icone}
                    </span>
                    <span style={mobileHeroStatValueStyle}>
                      {metrica.valor}
                    </span>
                  </span>
                ))}
              </div>

              <HomeHeroCarouselDots
                obras={obrasHero}
                activeIndex={heroIndex}
                onSelect={setHeroIndex}
                isDesktop={false}
              />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
