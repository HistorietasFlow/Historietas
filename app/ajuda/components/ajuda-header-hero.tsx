import Link from "next/link";

import type {
  HistorietasLanguage,
} from "../../../lib/i18n";

import {
  SvgIcon,
} from "./ajuda-svg-icon";
import {
  backButtonStyle,
  headerStyle,
  headerTextStyle,
  eyebrowStyle,
  pageTitleStyle,
  heroStyle,
  heroIconStyle,
  heroTextStyle,
  heroTitleStyle,
  heroDescriptionStyle,
  searchBoxStyle,
  searchInputStyle,
} from "../lib/ajuda-layout-styles";
import {
  traduzirTexto,
} from "../lib/ajuda-display-utils";

type AjudaHeaderHeroProps = {
  busca: string;
  language: HistorietasLanguage;
  onBuscaChange: (valor: string) => void;
  onLimparBusca: () => void;
};

export function AjudaHeaderHero({
  busca,
  language,
  onBuscaChange,
  onLimparBusca,
}: AjudaHeaderHeroProps) {
  function t(texto: {
    pt: string;
    en: string;
    es: string;
  }) {
    return traduzirTexto(texto, language);
  }

  return (
    <>
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
          <SvgIcon name="arrowLeft" size={25} strokeWidth={2.35} />
        </Link>

        <div style={headerTextStyle}>
          <span style={eyebrowStyle}>
            {t({
              pt: "SUPORTE",
              en: "SUPPORT",
              es: "SOPORTE",
            })}
          </span>
          <h1 style={pageTitleStyle}>
            {t({
              pt: "Central de ajuda",
              en: "Help center",
              es: "Centro de ayuda",
            })}
          </h1>
        </div>
      </header>

      <section style={heroStyle}>
        <span style={heroIconStyle}>
          <SvgIcon name="help" size={31} strokeWidth={2.15} />
        </span>

        <div style={heroTextStyle}>
          <h2 style={heroTitleStyle}>
            {t({
              pt: "Como podemos ajudar?",
              en: "How can we help?",
              es: "¿Cómo podemos ayudarte?",
            })}
          </h2>
          <p style={heroDescriptionStyle}>
            {t({
              pt: "Encontre respostas sobre sua conta, publicação, leitura, comunidade e privacidade.",
              en: "Find answers about your account, publishing, reading, community, and privacy.",
              es: "Encuentra respuestas sobre tu cuenta, publicación, lectura, comunidad y privacidad.",
            })}
          </p>
        </div>

        <label style={searchBoxStyle} htmlFor="buscar-ajuda">
          <SvgIcon name="search" size={23} strokeWidth={2.3} />
          <input
            id="buscar-ajuda"
            className="ajuda-search-input"
            value={busca}
            onChange={(event) =>
              onBuscaChange(event.target.value)
            }
            placeholder={t({
              pt: "Digite sua dúvida...",
              en: "Type your question...",
              es: "Escribe tu duda...",
            })}
            maxLength={100}
            autoComplete="off"
            style={searchInputStyle}
          />
          {busca ? (
            <button
              type="button"
              className="ajuda-clear-button"
              onClick={onLimparBusca}
              aria-label={t({
                pt: "Limpar busca",
                en: "Clear search",
                es: "Borrar búsqueda",
              })}
            >
              ×
            </button>
          ) : null}
        </label>
      </section>
    </>
  );
}
