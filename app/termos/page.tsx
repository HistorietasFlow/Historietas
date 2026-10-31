"use client";

import Link from "next/link";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../lib/historietasTheme";
import { TermosSvgIcon } from "./components/TermosSvgIcon";
import {
  ATALHOS_POLITICAS,
  DOCUMENTOS_POLITICAS,
  ETAPAS_LEITURA,
  PRINCIPIOS_PLATAFORMA,
  traduzirTexto,
  type TextoTraduzido,
} from "./lib/termos-content";
import {
  backButtonStyle,
  containerStyle,
  documentsCountStyle,
  documentsGridStyle,
  eyebrowStyle,
  headerStyle,
  headerTextStyle,
  heroBadgeStyle,
  heroDescriptionStyle,
  heroIconStyle,
  heroStyle,
  heroTextStyle,
  heroTitleStyle,
  noticeIconStyle,
  noticeStyle,
  noticeTextStyle,
  pageStyle,
  pageTitleStyle,
  principlesGridStyle,
  quickAccessGridStyle,
  quickAccessSectionStyle,
  sectionHeadingStyle,
  sectionKickerStyle,
  sectionStyle,
  sectionTitleStyle,
  stepsGridStyle,
  termosPageCss,
} from "./styles/termos-page-styles";

export default function TermosPage() {
  const { language } = useHistorietasLanguage();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

  function t(texto: TextoTraduzido) {
    return traduzirTexto(texto, language);
  }

  return (
    <main
      style={pageThemeStyle}
      data-historietas-termos-root="true"
    >
      <style>{`${historietasThemeCss}${termosPageCss}`}</style>

      <div style={containerStyle}>
        <header style={headerStyle}>
          <Link
            href="/configuracoes"
            style={backButtonStyle}
            aria-label={t({
              pt: "Voltar para Configurações",
              en: "Back to Settings",
              es: "Volver a Configuración",
            })}
          >
            <TermosSvgIcon name="arrowLeft" size={25} strokeWidth={2.35} />
          </Link>

          <div style={headerTextStyle}>
            <span style={eyebrowStyle}>
              {t({
                pt: "INFORMAÇÕES LEGAIS",
                en: "LEGAL INFORMATION",
                es: "INFORMACIÓN LEGAL",
              })}
            </span>
            <h1 style={pageTitleStyle}>
              {t({
                pt: "Termos e políticas",
                en: "Terms and policies",
                es: "Términos y políticas",
              })}
            </h1>
          </div>
        </header>

        <section style={heroStyle}>
          <span style={heroIconStyle}>
            <TermosSvgIcon name="scale" size={31} strokeWidth={2.05} />
          </span>

          <div style={heroTextStyle}>
            <span style={heroBadgeStyle}>
              <TermosSvgIcon name="check" size={16} strokeWidth={2.35} />
              {t({
                pt: "Área oficial do Historietas",
                en: "Official Historietas area",
                es: "Área oficial de Historietas",
              })}
            </span>

            <h2 style={heroTitleStyle}>
              {t({
                pt: "Conheça seus direitos e responsabilidades",
                en: "Understand your rights and responsibilities",
                es: "Conoce tus derechos y responsabilidades",
              })}
            </h2>

            <p style={heroDescriptionStyle}>
              {t({
                pt: "Consulte os documentos que explicam o funcionamento da plataforma, o tratamento de dados e as regras para participar da comunidade.",
                en: "Review the documents that explain how the platform works, how data is handled, and the rules for participating in the community.",
                es: "Consulta los documentos que explican el funcionamiento de la plataforma, el tratamiento de datos y las reglas para participar en la comunidad.",
              })}
            </p>
          </div>
        </section>

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
              <h2
                id="documentos-politicas-titulo"
                style={sectionTitleStyle}
              >
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

        <section
          style={sectionStyle}
          aria-labelledby="principios-politicas-titulo"
        >
          <div style={sectionHeadingStyle}>
            <div>
              <span style={sectionKickerStyle}>
                {t({
                  pt: "BASE DA PLATAFORMA",
                  en: "PLATFORM FOUNDATION",
                  es: "BASE DE LA PLATAFORMA",
                })}
              </span>
              <h2
                id="principios-politicas-titulo"
                style={sectionTitleStyle}
              >
                {t({
                  pt: "Princípios importantes",
                  en: "Important principles",
                  es: "Principios importantes",
                })}
              </h2>
            </div>
          </div>

          <div style={principlesGridStyle}>
            {PRINCIPIOS_PLATAFORMA.map((principio) => (
              <article key={principio.titulo.pt} className="termos-principle-card">
                <span className="termos-principle-icon">
                  <TermosSvgIcon
                    name={principio.icon}
                    size={24}
                    strokeWidth={2.05}
                  />
                </span>
                <div className="termos-principle-copy">
                  <h3>{t(principio.titulo)}</h3>
                  <p>{t(principio.descricao)}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          style={sectionStyle}
          aria-labelledby="leitura-politicas-titulo"
        >
          <div style={sectionHeadingStyle}>
            <div>
              <span style={sectionKickerStyle}>
                {t({
                  pt: "COMO CONSULTAR",
                  en: "HOW TO REVIEW",
                  es: "CÓMO CONSULTAR",
                })}
              </span>
              <h2
                id="leitura-politicas-titulo"
                style={sectionTitleStyle}
              >
                {t({
                  pt: "Use esta área em três passos",
                  en: "Use this area in three steps",
                  es: "Usa esta área en tres pasos",
                })}
              </h2>
            </div>
          </div>

          <div style={stepsGridStyle}>
            {ETAPAS_LEITURA.map((etapa) => (
              <article key={etapa.numero} className="termos-step-card">
                <span className="termos-step-number">{etapa.numero}</span>
                <div className="termos-step-copy">
                  <h3>{t(etapa.titulo)}</h3>
                  <p>{t(etapa.descricao)}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside style={noticeStyle}>
          <span style={noticeIconStyle}>
            <TermosSvgIcon name="info" size={24} strokeWidth={2.1} />
          </span>

          <div style={noticeTextStyle}>
            <strong>
              {t({
                pt: "Documentos transparentes e acessíveis",
                en: "Transparent and accessible documents",
                es: "Documentos transparentes y accesibles",
              })}
            </strong>
            <p>
              {t({
                pt: "Cada documento deve apresentar seu conteúdo de forma clara e indicar quando foi atualizado. Consulte novamente esta área sempre que tiver dúvidas sobre as regras do Historietas.",
                en: "Each document should present its content clearly and indicate when it was updated. Review this area again whenever you have questions about Historietas rules.",
                es: "Cada documento debe presentar su contenido con claridad e indicar cuándo fue actualizado. Consulta nuevamente esta área cuando tengas dudas sobre las reglas de Historietas.",
              })}
            </p>
          </div>
        </aside>

        <section
          style={quickAccessSectionStyle}
          aria-labelledby="atalhos-politicas-titulo"
        >
          <div style={sectionHeadingStyle}>
            <div>
              <span style={sectionKickerStyle}>
                {t({
                  pt: "ACESSO RÁPIDO",
                  en: "QUICK ACCESS",
                  es: "ACCESO RÁPIDO",
                })}
              </span>
              <h2
                id="atalhos-politicas-titulo"
                style={sectionTitleStyle}
              >
                {t({
                  pt: "Outras áreas úteis",
                  en: "Other useful areas",
                  es: "Otras áreas útiles",
                })}
              </h2>
            </div>
          </div>

          <div style={quickAccessGridStyle}>
            {ATALHOS_POLITICAS.map((atalho) => (
              <Link
                key={atalho.href}
                href={atalho.href}
                className="termos-quick-link"
              >
                <span className="termos-quick-icon">
                  <TermosSvgIcon name={atalho.icon} size={23} strokeWidth={2.05} />
                </span>

                <span className="termos-quick-copy">
                  <strong>{t(atalho.titulo)}</strong>
                  <span>{t(atalho.descricao)}</span>
                </span>

                <span className="termos-quick-arrow">
                  <TermosSvgIcon name="arrowRight" size={20} strokeWidth={2.25} />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
