export type StatusDenuncia =
  | "pendente"
  | "em_analise"
  | "resolvida"
  | "rejeitada";

export type StatusDenunciaPerfil =
  | "pendente"
  | "analisada"
  | "ignorada"
  | "resolvida";

export const STATUS_DENUNCIAS: StatusDenuncia[] = [
  "pendente",
  "em_analise",
  "resolvida",
  "rejeitada",
];

export const STATUS_LABEL: Record<StatusDenuncia, string> = {
  pendente: "Pendente",
  em_analise: "Em análise",
  resolvida: "Resolvida",
  rejeitada: "Rejeitada",
};

export const STATUS_DENUNCIAS_PERFIS: StatusDenunciaPerfil[] = [
  "pendente",
  "analisada",
  "ignorada",
  "resolvida",
];

export const STATUS_PERFIL_LABEL: Record<StatusDenunciaPerfil, string> = {
  pendente: "Pendente",
  analisada: "Analisada",
  ignorada: "Ignorada",
  resolvida: "Resolvida",
};

export function normalizarStatus(valor: unknown): StatusDenuncia {
  return STATUS_DENUNCIAS.includes(valor as StatusDenuncia)
    ? (valor as StatusDenuncia)
    : "pendente";
}

export function normalizarStatusPerfil(
  valor: unknown
): StatusDenunciaPerfil {
  return STATUS_DENUNCIAS_PERFIS.includes(valor as StatusDenunciaPerfil)
    ? (valor as StatusDenunciaPerfil)
    : "pendente";
}
