"use client";

import { useRef } from "react";
import type { ObraRanking, TipoRanking } from "../lib/em-alta-models";
import { listaTemRankingObra } from "../lib/em-alta-ranking-list-utils";
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
import { RankingCard } from "./em-alta-ranking-card";

export function RankingSection({
  titulo,
  obras,
  tipo,
  obrasFavoritas,
  obrasConcluidas,
  onAlternarFavorito: _onAlternarFavorito,
  onAlternarConcluido: _onAlternarConcluido,
  isDesktop,
}: {
  titulo: string;
  descricao: string;
  obras: ObraRanking[];
  tipo: TipoRanking;
  obrasFavoritas: string[];
  obrasConcluidas: string[];
  onAlternarFavorito: (obraId: string) => void;
  onAlternarConcluido: (obraId: string) => void;
  isDesktop: boolean;
}) {
  void _onAlternarFavorito;
  void _onAlternarConcluido;

  const tema = obterTemaRanking(tipo);
  const carrosselRef = useRef<HTMLDivElement | null>(null);
  const obrasComPosicao = obras.map((obra, index) => ({
    obra,
    posicao: index + 1,
  }));
  const obrasEmOrdem = [...obrasComPosicao].reverse();

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
          <span
            className={`historietas-em-alta-emoji-icon${
              tipo === "curtidas" ? " historietas-em-alta-heart-icon" : ""
            }`}
            style={{
              ...criarSectionIconStyle(tema),
              ...(tipo === "curtidas"
                ? {
                    color:
                      "#EF4444",
                    fontFamily: "Arial, Helvetica, sans-serif",
                  }
                : {}),
            }}
          >
            {tema.icone}
          </span>

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
              {titulo}
            </h2>
          </div>
        </div>
      </div>

      {obras.length > 0 ? (
        <div style={isDesktop ? desktopCarouselShellStyle : carouselShellStyle}>
          {isDesktop && obras.length > 3 && (
            <button
              type="button"
              aria-label={`Voltar carrossel ${titulo}`}
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
            aria-label={`${titulo} em carrossel`}
          >
            {obrasEmOrdem.map(({ obra, posicao }) => (
              <RankingCard
                key={`${tipo}-${obra.id}`}
                obra={obra}
                posicao={posicao}
                tipo={tipo}
                favorita={listaTemRankingObra(obra, obrasFavoritas)}
                concluida={listaTemRankingObra(obra, obrasConcluidas)}
                isDesktop={isDesktop}
              />
            ))}
          </div>

          {isDesktop && obras.length > 3 && (
            <button
              type="button"
              aria-label={`Avançar carrossel ${titulo}`}
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
      ) : (
        <p
          style={{
            margin: "10px 0 0",
            color: "#FFFFFF",
            fontSize: "12px",
            fontWeight: 800,
            textAlign: "center",
          }}
        >
          Nada para mostrar neste ranking
        </p>
      )}
    </section>
  );
}
