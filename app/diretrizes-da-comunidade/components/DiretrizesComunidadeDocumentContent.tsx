import Link from "next/link";
import { DiretrizesComunidadeSvgIcon } from "./DiretrizesComunidadeSvgIcon";
import {
  SECOES_DIRETRIZES,
  type TextoTraduzido,
} from "../lib/diretrizes-da-comunidade-content";
import {
  contentLayoutStyle,
  sectionsColumnStyle,
  tableOfContentsStyle,
  tocLabelStyle,
  tocLinksStyle,
} from "../styles/diretrizes-da-comunidade-styles";

type DiretrizesComunidadeTranslationProps = {
  t: (texto: TextoTraduzido) => string;
};

export function DiretrizesComunidadeDocumentContent({
  t,
}: DiretrizesComunidadeTranslationProps) {
  return (
<div
  style={contentLayoutStyle}
  className="diretrizes-content-layout"
>
  <nav
    style={tableOfContentsStyle}
    aria-label={t({
      pt: "Índice das Diretrizes da Comunidade",
      en: "Community Guidelines table of contents",
      es: "Índice de las Normas de la Comunidad",
    })}
  >
    <span style={tocLabelStyle}>
      {t({
        pt: "NESTA PÁGINA",
        en: "ON THIS PAGE",
        es: "EN ESTA PÁGINA",
      })}
    </span>

    <div style={tocLinksStyle}>
      {SECOES_DIRETRIZES.map((secao) => (
        <a
          key={secao.id}
          href={`#${secao.id}`}
          className="diretrizes-toc-link"
        >
          <span>{secao.numero}</span>
          <strong>{t(secao.titulo)}</strong>
        </a>
      ))}
    </div>
  </nav>

  <div style={sectionsColumnStyle}>
    {SECOES_DIRETRIZES.map((secao) => (
      <section
        key={secao.id}
        id={secao.id}
        className="diretrizes-section"
        aria-labelledby={`${secao.id}-titulo`}
      >
        <header className="diretrizes-section-header">
          <span className="diretrizes-section-icon">
            <DiretrizesComunidadeSvgIcon
              name={secao.icon}
              size={24}
              strokeWidth={2.05}
            />
          </span>

          <div className="diretrizes-section-heading">
            <span>
              {t({
                pt: `SEÇÃO ${secao.numero}`,
                en: `SECTION ${secao.numero}`,
                es: `SECCIÓN ${secao.numero}`,
              })}
            </span>

            <h2 id={`${secao.id}-titulo`}>
              {t(secao.titulo)}
            </h2>

            <p>{t(secao.resumo)}</p>
          </div>
        </header>

        <div className="diretrizes-section-content">
          {secao.paragrafos.map((paragrafo, index) => (
            <p key={`${secao.id}-paragrafo-${index}`}>
              {t(paragrafo)}
            </p>
          ))}

          {secao.permitido?.length ? (
            <div className="diretrizes-rule-box diretrizes-rule-box-allowed">
              <div className="diretrizes-rule-title">
                <DiretrizesComunidadeSvgIcon
                  name="check"
                  size={20}
                  strokeWidth={2.3}
                />
                <strong>
                  {t({
                    pt: "Permitido e recomendado",
                    en: "Allowed and encouraged",
                    es: "Permitido y recomendado",
                  })}
                </strong>
              </div>

              <ul>
                {secao.permitido.map((item, index) => (
                  <li key={`${secao.id}-permitido-${index}`}>
                    <span className="diretrizes-list-dot">
                      <DiretrizesComunidadeSvgIcon
                        name="check"
                        size={16}
                        strokeWidth={2.4}
                      />
                    </span>
                    <span>{t(item)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {secao.proibido?.length ? (
            <div className="diretrizes-rule-box diretrizes-rule-box-prohibited">
              <div className="diretrizes-rule-title">
                <DiretrizesComunidadeSvgIcon
                  name="ban"
                  size={20}
                  strokeWidth={2.3}
                />
                <strong>
                  {t({
                    pt: "Não permitido",
                    en: "Not allowed",
                    es: "No permitido",
                  })}
                </strong>
              </div>

              <ul>
                {secao.proibido.map((item, index) => (
                  <li key={`${secao.id}-proibido-${index}`}>
                    <span className="diretrizes-list-dot">
                      <DiretrizesComunidadeSvgIcon
                        name="ban"
                        size={16}
                        strokeWidth={2.4}
                      />
                    </span>
                    <span>{t(item)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {secao.id === "denuncias" ||
          secao.id === "contestacao" ||
          secao.id === "contato" ? (
            <Link
              href="/ajuda"
              className="diretrizes-primary-link"
            >
              <DiretrizesComunidadeSvgIcon
                name="help"
                size={20}
                strokeWidth={2.15}
              />
              <span>
                {t({
                  pt: "Acessar a Central de ajuda",
                  en: "Open the Help center",
                  es: "Acceder al Centro de ayuda",
                })}
              </span>
            </Link>
          ) : null}
        </div>
      </section>
    ))}
  </div>
</div>
  );
}
