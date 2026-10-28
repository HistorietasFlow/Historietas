import type { TextoTraduzido } from "../lib/admin-problemas-tecnicos-text-utils";
import type { ProblemaTecnico } from "../lib/admin-problemas-tecnicos-normalization-utils";
import {
  contentBoxStyle,
  detailLabelStyle,
  fullDescriptionStyle,
} from "../lib/admin-problemas-tecnicos-styles";

export function AdminProblemasTecnicosTicketDescription({ problema, t }: { problema: ProblemaTecnico; t: (texto: TextoTraduzido) => string }) {
  return <section style={contentBoxStyle}>
    <span style={detailLabelStyle}>
      {t({
        pt: "Descrição informada",
        en: "Reported description",
        es: "Descripción informada",
      })}
    </span>
    <p style={fullDescriptionStyle}>{problema.descricao}</p>
  </section>;
}
