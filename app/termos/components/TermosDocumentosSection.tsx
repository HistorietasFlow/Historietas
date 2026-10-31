import Link from "next/link";
import {
  DOCUMENTOS_POLITICAS,
  type TextoTraduzido,
} from "../lib/termos-content";
import {
  documentsCountStyle,
  documentsGridStyle,
  sectionHeadingStyle,
  sectionKickerStyle,
  sectionStyle,
  sectionTitleStyle,
} from "../styles/termos-page-styles";
import { TermosSvgIcon } from "./TermosSvgIcon";

type TermosDocumentosSectionProps = {
  t: (texto: TextoTraduzido) => string;
};

export function TermosDocumentosSection({ t }: TermosDocumentosSectionProps) {
  return (
    <section
      style={sectionStyle}
      aria-labelledby="documentos-politicas-titulo"
    >
      <div style={sectionHeadingStyle}>
        <div>
          <span style={sectionKickerStyle}>
            {t({
              pt: "DOCUMENTOS PRINCIPAIS",
              en: "MAIN DOCUMENTS",
              es: "DOCUMENTOS PRINCIPALES",
            })}
          </span>
          <h2 id="documentos-politicas-titulo" style={sectionTitleStyle}>
            {t({
              pt: "Escolha o que deseja consultar",
              en: "Choose what you want to review",
              es: "Elige lo que deseas consultar",
            })}
          </h2>
        </div>

        <span style={documentsCountStyle}>
          {DOCUMENTOS_POLITICAS.length}{" "}
          {t({
            pt: "documentos",
            en: "documents",
            es: "documentos",
          })}
        </span>
      </div>

      <div style={documentsGridStyle}>
        {DOCUMENTOS_POLITICAS.map((documento) => (
          <Link
            key={documento.href}
            href={documento.href}
            className="termos-document-link"
          >
            <span className="termos-document-icon">
              <TermosSvgIcon
                name={documento.icon}
                size={27}
                strokeWidth={2.05}
              />
            </span>

            <span className="termos-document-copy">
              <strong>{t(documento.titulo)}</strong>
              <span className="termos-document-description">
                {t(documento.descricao)}
              </span>

              <span className="termos-document-topics">
                {documento.temas.map((tema) => (
                  <span
                    key={`${documento.href}-${tema.pt}`}
                    className="termos-topic-chip"
                  >
                    {t(tema)}
                  </span>
                ))}
              </span>
            </span>

            <span className="termos-document-arrow">
              <TermosSvgIcon name="arrowRight" size={22} strokeWidth={2.35} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
