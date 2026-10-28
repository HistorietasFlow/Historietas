import { formatarData } from "../../../../lib/utils";
import type { TextoTraduzido } from "../lib/admin-problemas-tecnicos-text-utils";
import { lastReviewStyle } from "../lib/admin-problemas-tecnicos-styles";

export function AdminProblemasTecnicosTicketLastReview({
  analisadoEm,
  t,
}: {
  analisadoEm: string | null;
  t: (texto: TextoTraduzido) => string;
}) {
  if (!analisadoEm) return null;

  return (
    <span style={lastReviewStyle}>
      {t({
        pt: "Última análise:",
        en: "Last review:",
        es: "Última revisión:",
      })}{" "}
      {formatarData(analisadoEm)}
    </span>
  );
}
