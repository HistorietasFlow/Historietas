"use client";

import Link from "next/link";
import Image from "next/image";
import { useHistorietasLanguage } from "../../../components/HistorietasLanguageProvider";
import type { AutorExplorar } from "../lib/explorar-derived-utils";
import { criarIniciaisAutorExplorar, formatarMediaAvaliacaoAutorExplorar } from "../lib/explorar-author-profile-utils";
import { traduzirTextoExplorar, traduzirGeneroExplorar } from "../lib/explorar-translations";
import {
  autorExplorarCardStyle,
  desktopAutorExplorarCardStyle,
  autorExplorarGridCardStyle,
  desktopAutorExplorarGridCardStyle,
  autorExplorarCardGlowStyle,
  autorExplorarTopStyle,
  autorExplorarAvatarShellStyle,
  autorExplorarAvatarImageStyle,
  autorExplorarAvatarInitialsStyle,
  autorExplorarIdentityStyle,
  autorExplorarNameStyle,
  autorExplorarBioStyle,
  autorExplorarMetaRowStyle,
  autorExplorarMetaBadgeStyle,
  autorExplorarRatingStarStyle,
  autorExplorarBottomStyle,
  autorExplorarGenresStyle,
  autorExplorarGenreBadgeStyle,
  autorExplorarProfileButtonStyle,
} from "../lib/explorar-content-styles";

export default function AutorExplorarCard({
  autor,
  isDesktop,
  emGrade = false,
}: {
  autor: AutorExplorar;
  isDesktop?: boolean;
  emGrade?: boolean;
}) {
  const { language } = useHistorietasLanguage();
  const generos = autor.generos.length > 0 ? autor.generos : ["Historietas"];
  const nomeExibicao =
    autor.nome === "Autor não informado"
      ? traduzirTextoExplorar(autor.nome, language)
      : autor.nome;

  return (
    <Link
      href={autor.href}
      style={
        emGrade
          ? isDesktop
            ? desktopAutorExplorarGridCardStyle
            : autorExplorarGridCardStyle
          : isDesktop
            ? desktopAutorExplorarCardStyle
            : autorExplorarCardStyle
      }
      aria-label={
        language === "en"
          ? `Open author profile for ${nomeExibicao}`
          : language === "es"
            ? `Abrir el perfil del autor ${nomeExibicao}`
            : `Abrir perfil do autor ${nomeExibicao}`
      }
    >
      <span style={autorExplorarCardGlowStyle} aria-hidden="true" />

      <div style={autorExplorarTopStyle}>
        <div style={autorExplorarAvatarShellStyle}>
          {autor.avatar ? (
            <Image
              src={autor.avatar}
              alt={
                language === "en"
                  ? `${nomeExibicao} avatar`
                  : `Avatar de ${nomeExibicao}`
              }
              width={68}
              height={68}
              unoptimized
              style={autorExplorarAvatarImageStyle}
            />
          ) : (
            <span style={autorExplorarAvatarInitialsStyle}>
              {criarIniciaisAutorExplorar(nomeExibicao)}
            </span>
          )}
        </div>

        <div style={autorExplorarIdentityStyle}>
          <h3 style={autorExplorarNameStyle}>{nomeExibicao}</h3>
          <p style={autorExplorarBioStyle}>{autor.bio}</p>
        </div>
      </div>

      <div style={autorExplorarMetaRowStyle}>
        <span
          style={autorExplorarMetaBadgeStyle}
          aria-label={`${autor.totalObras} ${traduzirTextoExplorar(
            autor.totalObras === 1 ? "obra publicada" : "obras publicadas",
            language
          )}`}
        >
          📚 {autor.totalObras}
        </span>

        <span
          style={autorExplorarMetaBadgeStyle}
          aria-label={
            autor.avaliacao && autor.avaliacao.total > 0
              ? language === "en"
                ? `Average rating ${formatarMediaAvaliacaoAutorExplorar(
                    autor.avaliacao,
                    language
                  )} out of 5, from ${autor.avaliacao.total} ${
                    autor.avaliacao.total === 1 ? "rating" : "ratings"
                  }`
                : language === "es"
                  ? `Valoración media ${formatarMediaAvaliacaoAutorExplorar(
                      autor.avaliacao,
                      language
                    )} de 5, con ${autor.avaliacao.total} ${
                      autor.avaliacao.total === 1
                        ? "valoración"
                        : "valoraciones"
                    }`
                  : `Avaliação média ${formatarMediaAvaliacaoAutorExplorar(
                      autor.avaliacao,
                      language
                    )} de 5, com ${autor.avaliacao.total} ${
                      autor.avaliacao.total === 1
                        ? "avaliação"
                        : "avaliações"
                    }`
              : traduzirTextoExplorar("Autor ainda sem avaliações", language)
          }
        >
          <span style={autorExplorarRatingStarStyle} aria-hidden="true">
            ★
          </span>
          {formatarMediaAvaliacaoAutorExplorar(autor.avaliacao, language)}
        </span>

        {autor.totalCurtidas > 0 && (
          <span style={autorExplorarMetaBadgeStyle}>
            ❤️ {autor.totalCurtidas}
          </span>
        )}

        {autor.totalComentarios > 0 && (
          <span style={autorExplorarMetaBadgeStyle}>
            💬 {autor.totalComentarios}
          </span>
        )}
      </div>

      <div style={autorExplorarBottomStyle}>
        <div style={autorExplorarGenresStyle}>
          {generos.slice(0, 2).map((genero) => (
            <span
              key={`${autor.chave}-${genero}`}
              style={autorExplorarGenreBadgeStyle}
            >
              {traduzirGeneroExplorar(genero, language)}
            </span>
          ))}
        </div>

        <span
          data-historietas-page-background-action="true"
          style={autorExplorarProfileButtonStyle}
        >
          {traduzirTextoExplorar("Ver perfil", language)}
        </span>
      </div>
    </Link>
  );
}
