import Link from "next/link";

import type {
  HistorietasLanguage,
} from "../../../lib/i18n";

import {
  traduzirTexto,
} from "../lib/ajuda-display-utils";
import {
  supportErrorStyle,
  supportLoginLinkStyle,
  supportLoginNoticeStyle,
  supportSuccessStyle,
} from "../lib/ajuda-support-styles";

type AjudaSupportMessagesProps = {
  mensagem: string;
  erro: string;
  usuarioAutenticado: boolean | null;
  language: HistorietasLanguage;
};

export function AjudaSupportMessages({
  mensagem,
  erro,
  usuarioAutenticado,
  language,
}: AjudaSupportMessagesProps) {
  function t(texto: {
    pt: string;
    en: string;
    es: string;
  }) {
    return traduzirTexto(texto, language);
  }

  return (
    <>
      {mensagem ? (
        <div role="status" style={supportSuccessStyle}>
          {mensagem}
        </div>
      ) : null}

      {erro ? (
        <div role="alert" style={supportErrorStyle}>
          {erro}
        </div>
      ) : null}

      {usuarioAutenticado === false ? (
        <div style={supportLoginNoticeStyle}>
          <span>
            {t({
              pt: "Você precisa entrar na conta para enviar e acompanhar chamados.",
              en: "You need to sign in to submit and track tickets.",
              es: "Debes iniciar sesión para enviar y seguir casos.",
            })}
          </span>
          <Link
            href="/login?redirectTo=%2Fajuda%23problema-tecnico"
            style={supportLoginLinkStyle}
          >
            {t({ pt: "Entrar", en: "Sign in", es: "Iniciar sesión" })}
          </Link>
        </div>
      ) : null}
    </>
  );
}
