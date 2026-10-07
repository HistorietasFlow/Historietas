"use client";

import Link from "next/link";
import type { CapituloDinamico } from "../lib/obra-reading-utils";
import {
  accentSectionTitleStyle,
  chapterCardStyle,
  chapterContentStyle,
  chapterCountBadgeStyle,
  chapterMetaStyle,
  chapterNumberStyle,
  chapterTitleStyle,
  chaptersListStyle,
  chaptersSectionStyle,
  desktopChapterCardStyle,
  desktopChaptersListStyle,
  sectionHeaderStyle,
} from "../lib/obra-style-utils";

type ObraChaptersSectionProps = {
  isDesktop: boolean;
  capitulos: CapituloDinamico[];
  textoDisponibilidade: string;
};

export default function ObraChaptersSection({
  isDesktop,
  capitulos,
  textoDisponibilidade,
}: ObraChaptersSectionProps) {
  return (
    <section id="capitulos" style={chaptersSectionStyle}>
      <div style={sectionHeaderStyle}>
        <h2 style={accentSectionTitleStyle}>CAPÍTULOS</h2>

        <span style={chapterCountBadgeStyle}>{textoDisponibilidade}</span>
      </div>

      <div style={isDesktop ? desktopChaptersListStyle : chaptersListStyle}>
        {capitulos.map((capitulo) => (
          <Link
            key={capitulo.id || capitulo.numero}
            href={capitulo.href}
            style={isDesktop ? desktopChapterCardStyle : chapterCardStyle}
            aria-label={`Abrir ${capitulo.titulo}`}
          >
            <div style={chapterNumberStyle}>{capitulo.numero}</div>

            <div style={chapterContentStyle}>
              <h3 data-historietas-i18n-ignore="true" style={chapterTitleStyle}>{capitulo.titulo}</h3>

              {capitulo.descricao ? (
                <p style={chapterMetaStyle}>{capitulo.descricao}</p>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
