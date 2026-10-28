import { formatarData } from "../../../../lib/utils";
import {
  CATEGORIA_LABEL,
  PRIORIDADE_LABEL,
  STATUS_LABEL,
  corPrioridade,
  corStatus,
  type TextoTraduzido,
} from "../lib/admin-problemas-tecnicos-text-utils";
import type { ProblemaTecnico } from "../lib/admin-problemas-tecnicos-normalization-utils";
import {
  badgeStyle,
  badgesStyle,
  cardDescriptionPreviewStyle,
  cardHeadingStyle,
  cardMetaStyle,
  cardTitleStyle,
  categoryBadgeStyle,
} from "../lib/admin-problemas-tecnicos-styles";

export function AdminProblemasTecnicosTicketSummary({
  problema,
  aberto,
  nomeUsuario,
  t,
  onAlternarAbertura,
}: {
  problema: ProblemaTecnico;
  aberto: boolean;
  nomeUsuario: string;
  t: (texto: TextoTraduzido) => string;
  onAlternarAbertura: () => void;
}) {
  return (
    <button
      type="button"
      className="admin-tech-card-summary"
      onClick={onAlternarAbertura}
      aria-expanded={aberto}
    >
      <div style={cardHeadingStyle}>
        <div style={badgesStyle}>
          <span
            style={{
              ...badgeStyle,
              borderColor: `${corStatus(problema.status)}70`,
              color: corStatus(problema.status),
            }}
          >
            {t(STATUS_LABEL[problema.status])}
          </span>
          <span
            style={{
              ...badgeStyle,
              borderColor: `${corPrioridade(problema.prioridade)}70`,
              color: corPrioridade(problema.prioridade),
            }}
          >
            {t(PRIORIDADE_LABEL[problema.prioridade])}
          </span>
          <span style={categoryBadgeStyle}>
            {t(CATEGORIA_LABEL[problema.categoria])}
          </span>
        </div>

        <h2 style={cardTitleStyle}>{problema.titulo}</h2>
        <p style={cardDescriptionPreviewStyle}>{problema.descricao}</p>
      </div>

      <div style={cardMetaStyle}>
        <span>{nomeUsuario}</span>
        <span>{formatarData(problema.criadoEm)}</span>
        <span aria-hidden="true">{aberto ? "▲" : "▼"}</span>
      </div>
    </button>
  );
}
