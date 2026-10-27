export type StatusProblemaTecnico =
  | "aberto"
  | "em_analise"
  | "aguardando_usuario"
  | "resolvido"
  | "fechado";

export type PrioridadeProblemaTecnico = "baixa" | "normal" | "alta" | "urgente";

export type CategoriaProblemaTecnico =
  | "conta_acesso"
  | "publicacao"
  | "leitura"
  | "comunidade"
  | "diario"
  | "notificacoes"
  | "privacidade"
  | "desempenho"
  | "outro";

export type FiltroStatusProblema = StatusProblemaTecnico | "todos";

export type ProblemaTecnico = {
  id: string;
  userId: string;
  emailContato: string;
  categoria: CategoriaProblemaTecnico;
  titulo: string;
  descricao: string;
  paginaUrl: string;
  navegador: string;
  dispositivo: string;
  status: StatusProblemaTecnico;
  prioridade: PrioridadeProblemaTecnico;
  observacaoAdmin: string;
  analisadoPor: string;
  analisadoEm: string;
  criadoEm: string;
  atualizadoEm: string;
};

export const STATUS_PROBLEMAS: StatusProblemaTecnico[] = [
  "aberto",
  "em_analise",
  "aguardando_usuario",
  "resolvido",
  "fechado",
];

export const PRIORIDADES_PROBLEMAS: PrioridadeProblemaTecnico[] = [
  "baixa",
  "normal",
  "alta",
  "urgente",
];

export function normalizarStatus(valor: unknown): StatusProblemaTecnico {
  return STATUS_PROBLEMAS.includes(valor as StatusProblemaTecnico)
    ? (valor as StatusProblemaTecnico)
    : "aberto";
}

export function normalizarPrioridade(
  valor: unknown,
): PrioridadeProblemaTecnico {
  return PRIORIDADES_PROBLEMAS.includes(valor as PrioridadeProblemaTecnico)
    ? (valor as PrioridadeProblemaTecnico)
    : "normal";
}

export function normalizarCategoria(
  valor: unknown,
): CategoriaProblemaTecnico {
  const categorias = new Set<CategoriaProblemaTecnico>([
    "conta_acesso",
    "publicacao",
    "leitura",
    "comunidade",
    "diario",
    "notificacoes",
    "privacidade",
    "desempenho",
    "outro",
  ]);

  return categorias.has(valor as CategoriaProblemaTecnico)
    ? (valor as CategoriaProblemaTecnico)
    : "outro";
}
