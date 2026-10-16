"use client";

import { useRef } from "react";
import type { AutorRanking } from "../lib/em-alta-models";
import { obterTemaRanking } from "../lib/em-alta-ranking-category-theme";
import {
  carouselArrowLeftIconStyle,
  carouselArrowLeftStyle,
  carouselArrowRightIconStyle,
  carouselArrowRightStyle,
  carouselShellStyle,
  carouselStyle,
  criarDesktopSectionHeaderTemaStyle,
  criarSectionHeaderTemaStyle,
  criarSectionIconStyle,
  desktopCarouselShellStyle,
  desktopCarouselStyle,
  desktopSectionHeaderContentStyle,
  desktopSectionStyle,
  desktopSectionTextBlockStyle,
  sectionHeaderContentStyle,
  sectionStyle,
  sectionTextBlockStyle,
  sectionTitleStyle,
} from "../lib/em-alta-ranking-visual-style-utils";
import { AutorRankingCard } from "./em-alta-author-ranking-card";

export function AutoresEmAltaSection({
  autores,
  isDesktop,
}: {
  autores: AutorRanking[];
  isDesktop: boolean;
}) {
  const tema = obterTemaRanking("geral");
  const carrosselRef = useRef<HTMLDivElement | null>(null);
  const autoresComPosicao = autores.map((autor, index) => ({
    autor,
    posicao: index + 1,
  }));
  const autoresEmOrdem = [...autoresComPosicao].reverse();

  function rolarCarrossel(direcao: "esquerda" | "direita") {
    const carrossel = carrosselRef.current;

    if (!carrossel) {
      return;
    }

    const distancia = Math.max(320, Math.floor(carrossel.clientWidth * 0.82));

    carrossel.scrollBy({
      left: direcao === "direita" ? distancia : -distancia,
      behavior: "smooth",
    });
  }

  if (autores.length === 0) {
    return null;
  }

  return (
    <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
      <div
        style={
          isDesktop
            ? criarDesktopSectionHeaderTemaStyle(tema)
            : criarSectionHeaderTemaStyle(tema)
        }
      >
        <div
          style={
            isDesktop
              ? desktopSectionHeaderContentStyle
              : sectionHeaderContentStyle
          }
        >
          <span className="historietas-em-alta-emoji-icon" style={criarSectionIconStyle(tema)}>👤</span>

          <div
            style={
              isDesktop ? desktopSectionTextBlockStyle : sectionTextBlockStyle
            }
          >
            <h2
              style={
                isDesktop
                  ? {
                      ...sectionTitleStyle,
                      color: "#FFFFFF",
                      textAlign: "center",
                    }
                  : { ...sectionTitleStyle, color: "#FFFFFF" }
              }
            >
              Autores em Alta
            </h2>
          </div>
        </div>
      </div>

      <div style={isDesktop ? desktopCarouselShellStyle : carouselShellStyle}>
        {isDesktop && autores.length > 3 && (
          <button
            type="button"
            aria-label="Voltar carrossel Autores em Alta"
            onClick={(event) => {
              event.stopPropagation();
              rolarCarrossel("esquerda");
            }}
            style={carouselArrowLeftStyle}
          >
            <span aria-hidden="true" style={carouselArrowLeftIconStyle} />
          </button>
        )}

        <div
          ref={carrosselRef}
          style={isDesktop ? desktopCarouselStyle : carouselStyle}
          aria-label="Autores em Alta em carrossel"
        >
          {autoresEmOrdem.map(({ autor, posicao }) => (
            <AutorRankingCard
              key={`autor-ranking-${autor.id}`}
              autor={autor}
              posicao={posicao}
              isDesktop={isDesktop}
            />
          ))}
        </div>

        {isDesktop && autores.length > 3 && (
          <button
            type="button"
            aria-label="Avançar carrossel Autores em Alta"
            onClick={(event) => {
              event.stopPropagation();
              rolarCarrossel("direita");
            }}
            style={carouselArrowRightStyle}
          >
            <span aria-hidden="true" style={carouselArrowRightIconStyle} />
          </button>
        )}
      </div>
    </section>
  );
}
