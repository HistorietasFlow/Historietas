import Link from "next/link";
import { TermosDeUsoSvgIcon } from "./TermosDeUsoSvgIcon";
import {
  DESTAQUES_TERMOS,
  ULTIMA_ATUALIZACAO,
  type TextoTraduzido,
} from "../lib/termos-de-uso-content";
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
} from "../styles/termos-de-uso-styles";

type TermosDeUsoOverviewProps = {
  t: (texto: TextoTraduzido) => string;
};

export function TermosDeUsoOverview({
  t,
}: TermosDeUsoOverviewProps) {
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
    </>
  );
}
