import Link from "next/link";
import type { TextoTraduzido } from "../lib/admin-problemas-tecnicos-text-utils";
import type { ProblemaTecnico } from "../lib/admin-problemas-tecnicos-normalization-utils";
import {
  detailLabelStyle,
  environmentRowStyle,
  environmentStyle,
  environmentValueLinkStyle,
  environmentValueStyle,
} from "../lib/admin-problemas-tecnicos-styles";

export function AdminProblemasTecnicosTicketEnvironment({ problema, t }: { problema: ProblemaTecnico; t: (texto: TextoTraduzido) => string }) {
  if (!problema.paginaUrl && !problema.navegador && !problema.dispositivo) return null;
  return <section style={environmentStyle}>
    {problema.paginaUrl && <div style={environmentRowStyle}><span style={detailLabelStyle}>{t({ pt: "Página", en: "Page", es: "Página" })}</span>{problema.paginaUrl.startsWith("/") ? <Link href={problema.paginaUrl} style={environmentValueLinkStyle}>{problema.paginaUrl}</Link> : <span style={environmentValueStyle}>{problema.paginaUrl}</span>}</div>}
    {problema.dispositivo && <div style={environmentRowStyle}><span style={detailLabelStyle}>{t({ pt: "Dispositivo", en: "Device", es: "Dispositivo" })}</span><span style={environmentValueStyle}>{problema.dispositivo}</span></div>}
    {problema.navegador && <div style={environmentRowStyle}><span style={detailLabelStyle}>{t({ pt: "Navegador", en: "Browser", es: "Navegador" })}</span><span style={environmentValueStyle}>{problema.navegador}</span></div>}
  </section>;
}
