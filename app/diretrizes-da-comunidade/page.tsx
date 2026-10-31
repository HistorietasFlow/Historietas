"use client";

import Link from "next/link";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../lib/historietasTheme";
import { DiretrizesComunidadeSvgIcon } from "./components/DiretrizesComunidadeSvgIcon";
import {
  PRINCIPIOS_COMUNIDADE,
  SECOES_DIRETRIZES,
  ULTIMA_ATUALIZACAO,
  traduzirTexto,
  type TextoTraduzido,
} from "./lib/diretrizes-da-comunidade-content";
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
  importantNoticeIconStyle,
  importantNoticeStyle,
  importantNoticeTextStyle,
  pageStyle,
  pageTitleStyle,
  principlesGridStyle,
  principlesSectionStyle,
  sectionHeadingStyle,
  sectionKickerStyle,
  sectionTitleStyle,
  sectionsColumnStyle,
  tableOfContentsStyle,
  diretrizesCss,
  tocLabelStyle,
  tocLinksStyle,
  updatedAtStyle,
} from "./styles/diretrizes-da-comunidade-styles";

export default function DiretrizesDaComunidadePage() {
  const { language } = useHistorietasLanguage();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

  function t(texto: TextoTraduzido) {
    return traduzirTexto(texto, language);
  }

  return (
    <main
      style={pageThemeStyle}
      data-historietas-diretrizes-root="true"
    >
      <style>{`${historietasThemeCss}${diretrizesCss}`}</style>

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
            <DiretrizesComunidadeSvgIcon name="arrowLeft" size={25} strokeWidth={2.35} />
          </Link>

          <div style={headerTextStyle}>
            <span style={eyebrowStyle}>
              {t({
                pt: "CONVIVÊNCIA E SEGURANÇA",
                en: "COMMUNITY AND SAFETY",
                es: "CONVIVENCIA Y SEGURIDAD",
              })}
            </span>
            <h1 style={pageTitleStyle}>
              {t({
                pt: "Diretrizes da Comunidade",
                en: "Community Guidelines",
                es: "Normas de la Comunidad",
              })}
            </h1>
          </div>
        </header>

        <section style={heroStyle}>
          <span style={heroIconStyle}>
            <DiretrizesComunidadeSvgIcon name="users" size={31} strokeWidth={2.05} />
          </span>

          <div style={heroTextStyle}>
            <span style={heroBadgeStyle}>
              <DiretrizesComunidadeSvgIcon name="check" size={16} strokeWidth={2.35} />
              {t({
                pt: "Regras para uma comunidade segura",
                en: "Rules for a safer community",
                es: "Reglas para una comunidad segura",
              })}
            </span>

            <h2 style={heroTitleStyle}>
              {t({
                pt: "Crie, leia e participe com respeito",
                en: "Create, read, and participate respectfully",
                es: "Crea, lee y participa con respeto",
              })}
            </h2>

            <p style={heroDescriptionStyle}>
              {t({
                pt: "Estas Diretrizes explicam o que é permitido, o que deve ser evitado e como o Historietas age diante de riscos, abusos e violações.",
                en: "These Guidelines explain what is allowed, what should be avoided, and how Historietas responds to risks, abuse, and violations.",
                es: "Estas Normas explican qué está permitido, qué debe evitarse y cómo actúa Historietas ante riesgos, abusos e infracciones.",
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
            <DiretrizesComunidadeSvgIcon name="info" size={23} strokeWidth={2.1} />
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
                pt: "O Historietas apoia liberdade criativa, críticas e debates. Essa liberdade não inclui assédio, exploração, fraude, ameaças, plágio ou exposição indevida de outras pessoas.",
                en: "Historietas supports creative freedom, criticism, and debate. That freedom does not include harassment, exploitation, fraud, threats, plagiarism, or improper exposure of others.",
                es: "Historietas apoya la libertad creativa, las críticas y los debates. Esa libertad no incluye acoso, explotación, fraude, amenazas, plagio ni exposición indebida de otras personas.",
              })}
            </p>
          </div>
        </aside>

        <section
          style={principlesSectionStyle}
          aria-labelledby="principios-diretrizes"
        >
          <div style={sectionHeadingStyle}>
            <span style={sectionKickerStyle}>
              {t({
                pt: "PRINCÍPIOS",
                en: "PRINCIPLES",
                es: "PRINCIPIOS",
              })}
            </span>
            <h2
              id="principios-diretrizes"
              style={sectionTitleStyle}
            >
              {t({
                pt: "A base da comunidade",
                en: "The foundation of the community",
                es: "La base de la comunidad",
              })}
            </h2>
          </div>

          <div style={principlesGridStyle}>
            {PRINCIPIOS_COMUNIDADE.map((principio) => (
              <article
                key={principio.titulo.pt}
                className="diretrizes-principle"
              >
                <span className="diretrizes-principle-icon">
                  <DiretrizesComunidadeSvgIcon
                    name={principio.icon}
                    size={24}
                    strokeWidth={2.05}
                  />
                </span>

                <div className="diretrizes-principle-copy">
                  <h3>{t(principio.titulo)}</h3>
                  <p>{t(principio.descricao)}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

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

        <footer style={footerStyle}>
          <span style={footerIconStyle}>
            <DiretrizesComunidadeSvgIcon name="users" size={24} strokeWidth={2.05} />
          </span>

          <div style={footerTextStyle}>
            <strong>
              {t({
                pt: "Consulte os documentos relacionados",
                en: "Review related documents",
                es: "Consulta los documentos relacionados",
              })}
            </strong>
            <p>
              {t({
                pt: "Os Termos de Uso e a Política de Privacidade complementam estas Diretrizes da Comunidade.",
                en: "The Terms of Use and Privacy Policy complement these Community Guidelines.",
                es: "Los Términos de Uso y la Política de Privacidad complementan estas Normas de la Comunidad.",
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
            <DiretrizesComunidadeSvgIcon
              name="arrowRight"
              size={19}
              strokeWidth={2.3}
            />
          </Link>
        </footer>
      </div>
    </main>
  );
}
