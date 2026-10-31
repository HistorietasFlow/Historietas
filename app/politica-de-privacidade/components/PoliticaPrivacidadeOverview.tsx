import Link from "next/link";
import { PoliticaPrivacidadeSvgIcon } from "./PoliticaPrivacidadeSvgIcon";
import {
  DESTAQUES_PRIVACIDADE,
  ULTIMA_ATUALIZACAO,
  type TextoTraduzido,
} from "../lib/politica-de-privacidade-content";
import {
  backButtonStyle,
  eyebrowStyle,
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
  pageTitleStyle,
  sectionHeadingStyle,
  sectionKickerStyle,
  sectionTitleStyle,
  updatedAtStyle,
} from "../styles/politica-de-privacidade-styles";

type PoliticaPrivacidadeOverviewProps = {
  t: (texto: TextoTraduzido) => string;
};

export function PoliticaPrivacidadeOverview({
  t,
}: PoliticaPrivacidadeOverviewProps) {
  return (
    <>
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
    </>
  );
}
