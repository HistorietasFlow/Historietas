import { formatarData } from "../../../lib/utils";
import type { TextoTraduzido } from "../lib/admin-problemas-tecnicos-text-utils";
import type { ProblemaTecnico } from "../lib/admin-problemas-tecnicos-normalization-utils";
import {
  detailGridStyle,
  detailItemStyle,
  detailLabelStyle,
} from "../lib/admin-problemas-tecnicos-styles";

export function AdminProblemasTecnicosTicketInfoGrid({ problema, nomeUsuario, t }: { problema: ProblemaTecnico; nomeUsuario: string; t: (texto: TextoTraduzido) => string }) {
  return <div style={detailGridStyle}>
    <div style={detailItemStyle}><span style={detailLabelStyle}>{t({ pt: "Usuário", en: "User", es: "Usuario" })}</span><strong>{nomeUsuario}</strong></div>
    <div style={detailItemStyle}><span style={detailLabelStyle}>{t({ pt: "E-mail", en: "Email", es: "Correo" })}</span><strong>{problema.emailContato || "—"}</strong></div>
    <div style={detailItemStyle}><span style={detailLabelStyle}>{t({ pt: "Criado em", en: "Created", es: "Creado" })}</span><strong>{formatarData(problema.criadoEm)}</strong></div>
    <div style={detailItemStyle}><span style={detailLabelStyle}>{t({ pt: "Atualizado em", en: "Updated", es: "Actualizado" })}</span><strong>{formatarData(problema.atualizadoEm)}</strong></div>
  </div>;
}
