"use client";

import Image from "next/image";
import Link from "next/link";
import { useHistorietasLanguage } from "./HistorietasLanguageProvider";
import type { AutorHome } from "../app/lib/home-author-composition-utils";
import type { AvaliacaoAutorHome } from "../app/lib/home-format-utils";
import { formatarMediaAvaliacaoAutorHome } from "../app/lib/home-format-utils";
import {
  authorAvatarImageStyle,
  authorAvatarInitialsStyle,
  authorAvatarShellStyle,
  authorBottomRowStyle,
  authorCardBioStyle,
  authorCardGlowStyle,
  authorCardNameStyle,
  authorCardStyle,
  authorCardTopStyle,
  authorGenreBadgeStyle,
  authorGenreRowStyle,
  authorIdentityStyle,
  authorMetaBadgeStyle,
  authorMetaRowStyle,
  authorProfileButtonStyle,
  authorRatingStarStyle,
  desktopAuthorCardStyle,
} from "../app/lib/home-author-card-styles";
import { traduzirBioAutorHome, traduzirGeneroHome } from "../app/lib/home-metadata-utils";
import { criarIniciaisAutor } from "../app/lib/home-author-profile-utils";

export default function MobileAutorCard({
  autor,
  avaliacao,
  isDesktop,
}: {
  autor: AutorHome;
  avaliacao?: AvaliacaoAutorHome;
  isDesktop?: boolean;
}) {
  const { language } = useHistorietasLanguage();
  const generosAutor = autor.generos.length > 0 ? autor.generos : ["Historietas"];

  return (
    <Link
      href={autor.href}
      style={isDesktop ? desktopAuthorCardStyle : authorCardStyle}
      aria-label={`Abrir perfil do autor ${autor.nome}`}
    >
      <span style={authorCardGlowStyle} aria-hidden="true" />

      <div style={authorCardTopStyle}>
        <div style={authorAvatarShellStyle}>
          {autor.avatar ? (
            <Image
              src={autor.avatar}
              alt={`Avatar de ${autor.nome}`}
              width={68}
              height={68}
              unoptimized
              style={authorAvatarImageStyle}
            />
          ) : (
            <span style={authorAvatarInitialsStyle}>
              {criarIniciaisAutor(autor.nome)}
            </span>
          )}
        </div>

        <div style={authorIdentityStyle}>
          <h3 style={authorCardNameStyle}>{autor.nome}</h3>

          <p style={authorCardBioStyle}>{traduzirBioAutorHome(autor.bio, language)}</p>
        </div>
      </div>

      <div style={authorMetaRowStyle}>
        <span
          style={authorMetaBadgeStyle}
          aria-label={`${autor.totalObras} ${
            autor.totalObras === 1 ? "obra publicada" : "obras publicadas"
          }`}
        >
          📚 {autor.totalObras}
        </span>

        <span
          style={authorMetaBadgeStyle}
          aria-label={
            avaliacao && avaliacao.total > 0
              ? `Avaliação média ${formatarMediaAvaliacaoAutorHome(
                  avaliacao
                )} de 5, com ${avaliacao.total} ${
                  avaliacao.total === 1 ? "avaliação" : "avaliações"
                }`
              : "Autor ainda sem avaliações"
          }
        >
          <span style={authorRatingStarStyle} aria-hidden="true">
            ★
          </span>
          {formatarMediaAvaliacaoAutorHome(avaliacao)}
        </span>

        {autor.totalCurtidas > 0 && (
          <span style={authorMetaBadgeStyle}>❤️ {autor.totalCurtidas}</span>
        )}

        {autor.totalComentarios > 0 && (
          <span style={authorMetaBadgeStyle}>💬 {autor.totalComentarios}</span>
        )}
      </div>

      <div style={authorBottomRowStyle}>
        <div style={authorGenreRowStyle}>
          {generosAutor.slice(0, 2).map((genero) => (
            <span key={`${autor.chave}-${genero}`} style={authorGenreBadgeStyle}>
              {traduzirGeneroHome(genero, language)}
            </span>
          ))}
        </div>

        <span style={authorProfileButtonStyle}>Ver perfil</span>
      </div>
    </Link>
  );
}
