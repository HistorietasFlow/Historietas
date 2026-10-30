import type {
  HistorietasLanguage,
} from "../../../lib/i18n";

import {
  traduzirTexto,
} from "../lib/ajuda-display-utils";
import {
  noticeIconStyle,
  noticeStyle,
  noticeTextStyle,
} from "../lib/ajuda-layout-styles";
import {
  SvgIcon,
} from "./ajuda-svg-icon";

type AjudaGuidanceNoticeProps = {
  language: HistorietasLanguage;
};

export function AjudaGuidanceNotice({
  language,
}: AjudaGuidanceNoticeProps) {
  function t(texto: {
    pt: string;
    en: string;
    es: string;
  }) {
    return traduzirTexto(texto, language);
  }

  return (
    <aside style={noticeStyle}>
      <span style={noticeIconStyle}>
        <SvgIcon name="shield" size={24} strokeWidth={2.1} />
      </span>
      <div style={noticeTextStyle}>
        <strong>
          {t({
            pt: "Orientações da versão atual",
            en: "Current version guidance",
            es: "Orientaciones de la versión actual",
          })}
        </strong>
        <p>
          {t({
            pt: "Esta central descreve os recursos que já estão disponíveis no Historietas. Novas respostas serão adicionadas conforme a plataforma receber atualizações.",
            en: "This center describes features already available in Historietas. New answers will be added as the platform receives updates.",
            es: "Este centro describe las funciones que ya están disponibles en Historietas. Se agregarán nuevas respuestas a medida que la plataforma reciba actualizaciones.",
          })}
        </p>
      </div>
    </aside>
  );
}
