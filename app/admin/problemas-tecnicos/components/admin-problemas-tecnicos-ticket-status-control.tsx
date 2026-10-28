import {
  STATUS_LABEL,
  type TextoTraduzido,
} from "../lib/admin-problemas-tecnicos-text-utils";
import {
  STATUS_PROBLEMAS,
  type StatusProblemaTecnico,
} from "../lib/admin-problemas-tecnicos-normalization-utils";
import {
  fieldControlStyle,
  fieldLabelStyle,
  fieldStyle,
} from "../lib/admin-problemas-tecnicos-styles";

export function AdminProblemasTecnicosTicketStatusControl({ status, salvando, t, onAlterarStatus }: { status: StatusProblemaTecnico; salvando: boolean; t: (texto: TextoTraduzido) => string; onAlterarStatus: (status: StatusProblemaTecnico) => void }) {
  return <label style={fieldStyle}>
    <span style={fieldLabelStyle}>{t({ pt: "Status", en: "Status", es: "Estado" })}</span>
    <select value={status} disabled={salvando} onChange={(event) => onAlterarStatus(event.target.value as StatusProblemaTecnico)} style={fieldControlStyle}>
      {STATUS_PROBLEMAS.map((status) => <option key={status} value={status}>{t(STATUS_LABEL[status])}</option>)}
    </select>
  </label>;
}
