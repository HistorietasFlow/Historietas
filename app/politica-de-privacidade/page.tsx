"use client";

import Link from "next/link";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../lib/historietasTheme";
import { PoliticaPrivacidadeSvgIcon } from "./components/PoliticaPrivacidadeSvgIcon";
import {
  DESTAQUES_PRIVACIDADE,
  SECOES_PRIVACIDADE,
  ULTIMA_ATUALIZACAO,
  traduzirTexto,
  type TextoTraduzido,
} from "./lib/politica-de-privacidade-content";
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
  politicaPrivacidadeCss,
  tocLabelStyle,
  tocLinksStyle,
  updatedAtStyle,
} from "./styles/politica-de-privacidade-styles";

export default function PoliticaDePrivacidadePage() {
  const { language } = useHistorietasLanguage();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

  function t(texto: TextoTraduzido) {
    return traduzirTexto(texto, language);
  }

  return (
    <main
      style={pageThemeStyle}
      data-historietas-privacidade-root="true"
    >
      <style>{`${historietasThemeCss}${politicaPrivacidadeCss}`}</style>

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
            <PoliticaPrivacidadeSvgIcon name="arrowLeft" size={25} strokeWidth={2.35} />
          </Link>

          <div style={headerTextStyle}>
            <span style={eyebrowStyle}>
              {t({
                pt: "PROTEÇÃO DE DADOS",
                en: "DATA PROTECTION",
                es: "PROTECCIÓN DE DATOS",
              })}
            </span>
            <h1 style={pageTitleStyle}>
              {t({
                pt: "Política de Privacidade",
                en: "Privacy Policy",
                es: "Política de Privacidad",
              })}
            </h1>
          </div>
        </header>

        <section style={heroStyle}>
          <span style={heroIconStyle}>
            <PoliticaPrivacidadeSvgIcon name="shield" size={31} strokeWidth={2.05} />
          </span>

          <div style={heroTextStyle}>
            <span style={heroBadgeStyle}>
              <PoliticaPrivacidadeSvgIcon name="check" size={16} strokeWidth={2.35} />
              {t({
                pt: "Privacidade com transparência",
                en: "Privacy with transparency",
                es: "Privacidad con transparencia",
              })}
            </span>

            <h2 style={heroTitleStyle}>
              {t({
                pt: "Como o Historietas utiliza seus dados",
                en: "How Historietas uses your data",
                es: "Cómo Historietas utiliza tus datos",
              })}
            </h2>

            <p style={heroDescriptionStyle}>
              {t({
                pt: "Esta Política explica quais informações podem ser utilizadas, para que elas são necessárias, com quem podem ser compartilhadas e quais direitos pertencem a você.",
                en: "This Policy explains which information may be used, why it is necessary, with whom it may be shared, and which rights belong to you.",
                es: "Esta Política explica qué información puede utilizarse, por qué es necesaria, con quién puede compartirse y qué derechos te pertenecen.",
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
            <PoliticaPrivacidadeSvgIcon name="info" size={23} strokeWidth={2.1} />
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
                pt: "O Historietas utiliza dados para manter sua conta, publicar e exibir conteúdo, registrar interações, aplicar preferências, proteger a comunidade e operar a plataforma. Você pode controlar várias áreas do perfil e solicitar o exercício de direitos pela Central de ajuda.",
                en: "Historietas uses data to maintain your account, publish and display content, record interactions, apply preferences, protect the community, and operate the platform. You may control several profile areas and request the exercise of rights through the Help center.",
                es: "Historietas utiliza datos para mantener tu cuenta, publicar y mostrar contenido, registrar interacciones, aplicar preferencias, proteger la comunidad y operar la plataforma. Puedes controlar varias áreas del perfil y solicitar el ejercicio de derechos mediante el Centro de ayuda.",
              })}
            </p>
          </div>
        </aside>

        <section
          style={highlightsSectionStyle}
          aria-labelledby="destaques-politica-privacidade"
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
              id="destaques-politica-privacidade"
              style={sectionTitleStyle}
            >
              {t({
                pt: "Compromissos desta Política",
                en: "Commitments of this Policy",
                es: "Compromisos de esta Política",
              })}
            </h2>
          </div>

          <div style={highlightsGridStyle}>
            {DESTAQUES_PRIVACIDADE.map((destaque) => (
              <article
                key={destaque.titulo.pt}
                className="privacidade-highlight"
              >
                <span className="privacidade-highlight-icon">
                  <PoliticaPrivacidadeSvgIcon
                    name={destaque.icon}
                    size={24}
                    strokeWidth={2.05}
                  />
                </span>

                <div className="privacidade-highlight-copy">
                  <h3>{t(destaque.titulo)}</h3>
                  <p>{t(destaque.descricao)}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div
          style={contentLayoutStyle}
          className="privacidade-content-layout"
        >
          <nav
            style={tableOfContentsStyle}
            aria-label={t({
              pt: "Índice da Política de Privacidade",
              en: "Privacy Policy table of contents",
              es: "Índice de la Política de Privacidad",
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
              {SECOES_PRIVACIDADE.map((secao) => (
                <a
                  key={secao.id}
                  href={`#${secao.id}`}
                  className="privacidade-toc-link"
                >
                  <span>{secao.numero}</span>
                  <strong>{t(secao.titulo)}</strong>
                </a>
              ))}
            </div>
          </nav>

          <div style={sectionsColumnStyle}>
            {SECOES_PRIVACIDADE.map((secao) => (
              <section
                key={secao.id}
                id={secao.id}
                className="privacidade-section"
                aria-labelledby={`${secao.id}-titulo`}
              >
                <header className="privacidade-section-header">
                  <span className="privacidade-section-icon">
                    <PoliticaPrivacidadeSvgIcon
                      name={secao.icon}
                      size={24}
                      strokeWidth={2.05}
                    />
                  </span>

                  <div className="privacidade-section-heading">
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

                <div className="privacidade-section-content">
                  {secao.paragrafos.map((paragrafo, index) => (
                    <p key={`${secao.id}-paragrafo-${index}`}>
                      {t(paragrafo)}
                    </p>
                  ))}

                  {secao.itens?.length ? (
                    <ul>
                      {secao.itens.map((item, index) => (
                        <li key={`${secao.id}-item-${index}`}>
                          <span className="privacidade-list-check">
                            <PoliticaPrivacidadeSvgIcon
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

                  {secao.id === "conteudo-publico" ? (
                    <Link
                      href="/configuracoes"
                      className="privacidade-inline-link"
                    >
                      <PoliticaPrivacidadeSvgIcon
                        name="settings"
                        size={19}
                        strokeWidth={2.15}
                      />
                      <span>
                        {t({
                          pt: "Abrir controles de privacidade",
                          en: "Open privacy controls",
                          es: "Abrir controles de privacidad",
                        })}
                      </span>
                      <PoliticaPrivacidadeSvgIcon
                        name="arrowRight"
                        size={18}
                        strokeWidth={2.3}
                      />
                    </Link>
                  ) : null}

                  {secao.id === "armazenamento-local" ? (
                    <Link
                      href="/configuracoes"
                      className="privacidade-inline-link"
                    >
                      <PoliticaPrivacidadeSvgIcon
                        name="download"
                        size={19}
                        strokeWidth={2.15}
                      />
                      <span>
                        {t({
                          pt: "Abrir dados e backup",
                          en: "Open data and backup",
                          es: "Abrir datos y copia de seguridad",
                        })}
                      </span>
                      <PoliticaPrivacidadeSvgIcon
                        name="arrowRight"
                        size={18}
                        strokeWidth={2.3}
                      />
                    </Link>
                  ) : null}

                  {secao.id === "seguranca" ? (
                    <div className="privacidade-alert-box">
                      <span>
                        <PoliticaPrivacidadeSvgIcon
                          name="alert"
                          size={21}
                          strokeWidth={2.1}
                        />
                      </span>
                      <p>
                        {t({
                          pt: "Nunca informe sua senha em comentários, publicações ou mensagens. O Historietas não precisa conhecer sua senha para prestar atendimento.",
                          en: "Never disclose your password in comments, posts, or messages. Historietas does not need to know your password to provide support.",
                          es: "Nunca informes tu contraseña en comentarios, publicaciones o mensajes. Historietas no necesita conocer tu contraseña para prestar atención.",
                        })}
                      </p>
                    </div>
                  ) : null}

                  {secao.id === "direitos" || secao.id === "contato" ? (
                    <Link
                      href="/ajuda"
                      className="privacidade-primary-link"
                    >
                      <PoliticaPrivacidadeSvgIcon
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
            <PoliticaPrivacidadeSvgIcon name="shield" size={24} strokeWidth={2.05} />
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
                pt: "Os Termos de Uso e as Diretrizes da Comunidade complementam esta Política de Privacidade.",
                en: "The Terms of Use and Community Guidelines complement this Privacy Policy.",
                es: "Los Términos de Uso y las Normas de la Comunidad complementan esta Política de Privacidad.",
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
            <PoliticaPrivacidadeSvgIcon name="arrowRight" size={19} strokeWidth={2.3} />
          </Link>
        </footer>
      </div>
    </main>
  );
}
