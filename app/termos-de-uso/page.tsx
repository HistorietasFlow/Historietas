"use client";

import Link from "next/link";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../lib/historietasTheme";
import { TermosDeUsoSvgIcon } from "./components/TermosDeUsoSvgIcon";
import {
  DESTAQUES_TERMOS,
  SECOES_TERMOS,
  ULTIMA_ATUALIZACAO,
  traduzirTexto,
  type TextoTraduzido,
} from "./lib/termos-de-uso-content";
import {
  backButtonStyle,
  containerStyle,
  contentLayoutStyle,
  eyebrowStyle,
  footerIconStyle,
  footerLinkStyle,
  footerStyle,
  footerTextStyle,
  headerStyle,
  headerTextStyle,
  heroBadgeStyle,
  heroDescriptionStyle,
  heroIconStyle,
  heroStyle,
  heroTextStyle,
  heroTitleStyle,
  highlightsGridStyle,
  highlightsSectionStyle,
  importantNoticeIconStyle,
  importantNoticeStyle,
  importantNoticeTextStyle,
  pageStyle,
  pageTitleStyle,
  sectionHeadingStyle,
  sectionKickerStyle,
  sectionTitleStyle,
  sectionsColumnStyle,
  tableOfContentsStyle,
  termosUsoCss,
  tocLabelStyle,
  tocLinksStyle,
  updatedAtStyle,
} from "./styles/termos-de-uso-styles";

export default function TermosDeUsoPage() {
  const { language } = useHistorietasLanguage();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

  function t(texto: TextoTraduzido) {
    return traduzirTexto(texto, language);
  }

  return (
    <main
      style={pageThemeStyle}
      data-historietas-termos-uso-root="true"
    >
      <style>{`${historietasThemeCss}${termosUsoCss}`}</style>

      <div style={containerStyle}>
        <header style={headerStyle}>
          <Link
            href="/termos"
            style={backButtonStyle}
            aria-label={t({
              pt: "Voltar para Termos e políticas",
              en: "Back to Terms and policies",
              es: "Volver a Términos y políticas",
            })}
          >
            <TermosDeUsoSvgIcon name="arrowLeft" size={25} strokeWidth={2.35} />
          </Link>

          <div style={headerTextStyle}>
            <span style={eyebrowStyle}>
              {t({
                pt: "DOCUMENTO OFICIAL",
                en: "OFFICIAL DOCUMENT",
                es: "DOCUMENTO OFICIAL",
              })}
            </span>
            <h1 style={pageTitleStyle}>
              {t({
                pt: "Termos de Uso",
                en: "Terms of Use",
                es: "Términos de Uso",
              })}
            </h1>
          </div>
        </header>

        <section style={heroStyle}>
          <span style={heroIconStyle}>
            <TermosDeUsoSvgIcon name="file" size={31} strokeWidth={2.05} />
          </span>

          <div style={heroTextStyle}>
            <span style={heroBadgeStyle}>
              <TermosDeUsoSvgIcon name="check" size={16} strokeWidth={2.35} />
              {t({
                pt: "Leitura recomendada",
                en: "Recommended reading",
                es: "Lectura recomendada",
              })}
            </span>

            <h2 style={heroTitleStyle}>
              {t({
                pt: "Regras para utilizar o Historietas",
                en: "Rules for using Historietas",
                es: "Reglas para utilizar Historietas",
              })}
            </h2>

            <p style={heroDescriptionStyle}>
              {t({
                pt: "Este documento explica as condições para criar uma conta, publicar obras, interagir com a comunidade e utilizar os recursos da plataforma.",
                en: "This document explains the conditions for creating an account, publishing works, interacting with the community, and using platform features.",
                es: "Este documento explica las condiciones para crear una cuenta, publicar obras, interactuar con la comunidad y utilizar las funciones de la plataforma.",
              })}
            </p>

            <span style={updatedAtStyle}>
              {t({
                pt: "Última atualização:",
                en: "Last updated:",
                es: "Última actualización:",
              })}{" "}
              <strong>{t(ULTIMA_ATUALIZACAO)}</strong>
            </span>
          </div>
        </section>

        <aside style={importantNoticeStyle}>
          <span style={importantNoticeIconStyle}>
            <TermosDeUsoSvgIcon name="info" size={23} strokeWidth={2.1} />
          </span>

          <div style={importantNoticeTextStyle}>
            <strong>
              {t({
                pt: "Resumo importante",
                en: "Important summary",
                es: "Resumen importante",
              })}
            </strong>
            <p>
              {t({
                pt: "Você mantém os direitos sobre suas obras, mas precisa publicar apenas materiais que possa utilizar. O uso do Historietas exige respeito à lei, à comunidade e aos direitos de outras pessoas.",
                en: "You retain the rights to your works, but you must publish only materials you are allowed to use. Using Historietas requires respect for the law, the community, and other people's rights.",
                es: "Conservas los derechos sobre tus obras, pero debes publicar solo materiales que puedas utilizar. El uso de Historietas exige respeto por la ley, la comunidad y los derechos de otras personas.",
              })}
            </p>
          </div>
        </aside>

        <section
          style={highlightsSectionStyle}
          aria-labelledby="destaques-termos-uso"
        >
          <div style={sectionHeadingStyle}>
            <span style={sectionKickerStyle}>
              {t({
                pt: "PONTOS PRINCIPAIS",
                en: "KEY POINTS",
                es: "PUNTOS PRINCIPALES",
              })}
            </span>
            <h2
              id="destaques-termos-uso"
              style={sectionTitleStyle}
            >
              {t({
                pt: "O essencial antes de continuar",
                en: "What matters before you continue",
                es: "Lo esencial antes de continuar",
              })}
            </h2>
          </div>

          <div style={highlightsGridStyle}>
            {DESTAQUES_TERMOS.map((destaque) => (
              <article
                key={destaque.titulo.pt}
                className="termos-uso-highlight"
              >
                <span className="termos-uso-highlight-icon">
                  <TermosDeUsoSvgIcon
                    name={destaque.icon}
                    size={24}
                    strokeWidth={2.05}
                  />
                </span>
                <div className="termos-uso-highlight-copy">
                  <h3>{t(destaque.titulo)}</h3>
                  <p>{t(destaque.descricao)}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div style={contentLayoutStyle} className="termos-uso-content-layout">
          <nav
            style={tableOfContentsStyle}
            aria-label={t({
              pt: "Índice dos Termos de Uso",
              en: "Terms of Use table of contents",
              es: "Índice de los Términos de Uso",
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
              {SECOES_TERMOS.map((secao) => (
                <a
                  key={secao.id}
                  href={`#${secao.id}`}
                  className="termos-uso-toc-link"
                >
                  <span>{secao.numero}</span>
                  <strong>{t(secao.titulo)}</strong>
                </a>
              ))}
            </div>
          </nav>

          <div style={sectionsColumnStyle}>
            {SECOES_TERMOS.map((secao) => (
              <section
                key={secao.id}
                id={secao.id}
                className="termos-uso-section"
                aria-labelledby={`${secao.id}-titulo`}
              >
                <header className="termos-uso-section-header">
                  <span className="termos-uso-section-icon">
                    <TermosDeUsoSvgIcon
                      name={secao.icon}
                      size={24}
                      strokeWidth={2.05}
                    />
                  </span>

                  <div className="termos-uso-section-heading">
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

                <div className="termos-uso-section-content">
                  {secao.paragrafos.map((paragrafo, index) => (
                    <p key={`${secao.id}-paragrafo-${index}`}>
                      {t(paragrafo)}
                    </p>
                  ))}

                  {secao.itens?.length ? (
                    <ul>
                      {secao.itens.map((item, index) => (
                        <li key={`${secao.id}-item-${index}`}>
                          <span className="termos-uso-list-check">
                            <TermosDeUsoSvgIcon
                              name="check"
                              size={18}
                              strokeWidth={2.35}
                            />
                          </span>
                          <span>{t(item)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {secao.id === "direitos-autorais" ? (
                    <Link
                      href="/ajuda"
                      className="termos-uso-inline-link"
                    >
                      <span>
                        {t({
                          pt: "Acessar a Central de ajuda",
                          en: "Open the Help center",
                          es: "Acceder al Centro de ayuda",
                        })}
                      </span>
                      <TermosDeUsoSvgIcon
                        name="arrowRight"
                        size={19}
                        strokeWidth={2.3}
                      />
                    </Link>
                  ) : null}

                  {secao.id === "encerramento" ? (
                    <Link
                      href="/configuracoes"
                      className="termos-uso-inline-link"
                    >
                      <span>
                        {t({
                          pt: "Abrir Configurações da conta",
                          en: "Open account Settings",
                          es: "Abrir Configuración de la cuenta",
                        })}
                      </span>
                      <TermosDeUsoSvgIcon
                        name="arrowRight"
                        size={19}
                        strokeWidth={2.3}
                      />
                    </Link>
                  ) : null}

                  {secao.id === "contato" ? (
                    <Link
                      href="/ajuda"
                      className="termos-uso-primary-link"
                    >
                      <TermosDeUsoSvgIcon
                        name="help"
                        size={20}
                        strokeWidth={2.15}
                      />
                      <span>
                        {t({
                          pt: "Ir para a Central de ajuda",
                          en: "Go to the Help center",
                          es: "Ir al Centro de ayuda",
                        })}
                      </span>
                    </Link>
                  ) : null}
                </div>
              </section>
            ))}
          </div>
        </div>

        <footer style={footerStyle}>
          <span style={footerIconStyle}>
            <TermosDeUsoSvgIcon name="scale" size={24} strokeWidth={2.05} />
          </span>

          <div style={footerTextStyle}>
            <strong>
              {t({
                pt: "Consulte os demais documentos",
                en: "Review the other documents",
                es: "Consulta los demás documentos",
              })}
            </strong>
            <p>
              {t({
                pt: "A Política de Privacidade e as Diretrizes da Comunidade complementam estes Termos de Uso.",
                en: "The Privacy Policy and Community Guidelines complement these Terms of Use.",
                es: "La Política de Privacidad y las Normas de la Comunidad complementan estos Términos de Uso.",
              })}
            </p>
          </div>

          <Link
            href="/termos"
            style={footerLinkStyle}
          >
            <span>
              {t({
                pt: "Termos e políticas",
                en: "Terms and policies",
                es: "Términos y políticas",
              })}
            </span>
            <TermosDeUsoSvgIcon name="arrowRight" size={19} strokeWidth={2.3} />
          </Link>
        </footer>
      </div>
    </main>
  );
}
