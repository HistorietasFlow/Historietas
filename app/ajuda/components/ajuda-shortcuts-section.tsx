import Link from "next/link";

import type {
  HistorietasLanguage,
} from "../../../lib/i18n";

import {
  ATALHOS_AJUDA,
} from "../lib/ajuda-content";
import {
  traduzirTexto,
} from "../lib/ajuda-display-utils";
import {
  sectionHeadingStyle,
  sectionKickerStyle,
  sectionStyle,
  sectionTitleStyle,
  shortcutsGridStyle,
} from "../lib/ajuda-layout-styles";
import {
  SvgIcon,
} from "./ajuda-svg-icon";

type AjudaShortcutsSectionProps = {
  language: HistorietasLanguage;
};

export function AjudaShortcutsSection({
  language,
}: AjudaShortcutsSectionProps) {
  function t(texto: {
    pt: string;
    en: string;
    es: string;
  }) {
    return traduzirTexto(texto, language);
  }

  return (
    <section style={sectionStyle} aria-labelledby="atalhos-ajuda-titulo">
      <div style={sectionHeadingStyle}>
        <div>
          <span style={sectionKickerStyle}>
            {t({
              pt: "ACESSO RÁPIDO",
              en: "QUICK ACCESS",
              es: "ACCESO RÁPIDO",
            })}
          </span>
          <h2 id="atalhos-ajuda-titulo" style={sectionTitleStyle}>
            {t({
              pt: "Atalhos úteis",
              en: "Useful shortcuts",
              es: "Accesos útiles",
            })}
          </h2>
        </div>
      </div>

      <div style={shortcutsGridStyle}>
        {ATALHOS_AJUDA.map((atalho) => (
          <Link
            key={atalho.href}
            href={atalho.href}
            className="ajuda-shortcut-link"
          >
            <span className="ajuda-shortcut-icon">
              <SvgIcon name={atalho.icon} size={23} strokeWidth={2.05} />
            </span>
            <span className="ajuda-shortcut-copy">
              <strong>{t(atalho.titulo)}</strong>
              <span>{t(atalho.descricao)}</span>
            </span>
            <span className="ajuda-shortcut-arrow">
              <SvgIcon name="arrowRight" size={20} strokeWidth={2.25} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
