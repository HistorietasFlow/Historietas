import type {
  ReactNode,
} from "react";

import type {
  HistorietasLanguage,
} from "../../../lib/i18n";

import {
  SvgIcon,
} from "./ajuda-svg-icon";
import {
  traduzirTexto,
} from "../lib/ajuda-display-utils";
import {
  sectionHeadingStyle,
  sectionKickerStyle,
  sectionStyle,
  sectionTitleStyle,
} from "../lib/ajuda-layout-styles";
import {
  supportCardStyle,
  supportSeparationIconStyle,
  supportSeparationNoticeStyle,
  supportSeparationTextStyle,
} from "../lib/ajuda-support-styles";

type AjudaSupportSectionShellProps = {
  language: HistorietasLanguage;
  children: ReactNode;
};

export function AjudaSupportSectionShell({
  language,
  children,
}: AjudaSupportSectionShellProps) {
  function t(texto: {
    pt: string;
    en: string;
    es: string;
  }) {
    return traduzirTexto(texto, language);
  }

  return (
    <section
      id="problema-tecnico"
      style={sectionStyle}
      aria-labelledby="problema-tecnico-titulo"
    >
      <div style={sectionHeadingStyle}>
        <div>
          <span style={sectionKickerStyle}>
            {t({
              pt: "SUPORTE TÉCNICO",
              en: "TECHNICAL SUPPORT",
              es: "SOPORTE TÉCNICO",
            })}
          </span>
          <h2 id="problema-tecnico-titulo" style={sectionTitleStyle}>
            {t({
              pt: "Relatar um problema técnico",
              en: "Report a technical issue",
              es: "Informar un problema técnico",
            })}
          </h2>
        </div>
      </div>

      <div style={supportCardStyle}>
        <div style={supportSeparationNoticeStyle}>
          <span style={supportSeparationIconStyle}>
            <SvgIcon name="settings" size={23} strokeWidth={2.1} />
          </span>
          <div style={supportSeparationTextStyle}>
            <strong>
              {t({
                pt: "Falha técnica não é denúncia",
                en: "A technical issue is not a report",
                es: "Una falla técnica no es una denuncia",
              })}
            </strong>
            <p>
              {t({
                pt: "Use este formulário para erros, travamentos, páginas que não carregam ou recursos que não funcionam. Para conteúdo, perfis ou comentários que violem as regras, use o botão Denunciar no próprio conteúdo.",
                en: "Use this form for errors, crashes, pages that do not load, or features that do not work. For content, profiles, or comments that violate the rules, use the Report button on that content.",
                es: "Usa este formulario para errores, bloqueos, páginas que no cargan o funciones que no funcionan. Para contenido, perfiles o comentarios que infrinjan las reglas, usa el botón Denunciar en ese contenido.",
              })}
            </p>
          </div>
        </div>

        {children}
      </div>
    </section>
  );
}
