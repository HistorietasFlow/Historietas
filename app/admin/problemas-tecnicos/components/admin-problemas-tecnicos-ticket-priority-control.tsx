import {
  PRIORIDADE_LABEL,
  type TextoTraduzido,
} from "../lib/admin-problemas-tecnicos-text-utils";
import {
  PRIORIDADES_PROBLEMAS,
  type PrioridadeProblemaTecnico,
} from "../lib/admin-problemas-tecnicos-normalization-utils";
import {
  fieldControlStyle,
  fieldLabelStyle,
  fieldStyle,
} from "../lib/admin-problemas-tecnicos-styles";

export function AdminProblemasTecnicosTicketPriorityControl({ prioridade, salvando, t, onAlterarPrioridade }: { prioridade: PrioridadeProblemaTecnico; salvando: boolean; t: (texto: TextoTraduzido) => string; onAlterarPrioridade: (prioridade: PrioridadeProblemaTecnico) => void }) {
  return <label style={fieldStyle}>
    <span style={fieldLabelStyle}>{t({ pt: "Prioridade", en: "Priority", es: "Prioridad" })}</span>
    <select value={prioridade} disabled={salvando} onChange={(event) => onAlterarPrioridade(event.target.value as PrioridadeProblemaTecnico)} style={fieldControlStyle}>
      {PRIORIDADES_PROBLEMAS.map((prioridade) => <option key={prioridade} value={prioridade}>{t(PRIORIDADE_LABEL[prioridade])}</option>)}
    </select>
  </label>;
}
