import type { HistorietasLanguage } from "./i18n";

export const STATUS_EDITORIAIS = ["em_andamento", "concluida", "pausada"] as const;
export type StatusEditorial = (typeof STATUS_EDITORIAIS)[number];

export function ehStatusEditorial(valor: unknown): valor is StatusEditorial {
  return STATUS_EDITORIAIS.some((status) => status === valor);
}

export function filtroStatusEditorial(valor: unknown): StatusEditorial | "" {
  return ehStatusEditorial(valor) ? valor : "";
}

const textos = {
  "pt-BR": { label: "Estado da história", todos: "Todos os estados", indefinido: "Não informado", em_andamento: "Em andamento", concluida: "Concluída", pausada: "Pausada" },
  en: { label: "Story status", todos: "All story statuses", indefinido: "Not specified", em_andamento: "Ongoing", concluida: "Completed", pausada: "On hiatus" },
  es: { label: "Estado de la historia", todos: "Todos los estados", indefinido: "No informado", em_andamento: "En curso", concluida: "Finalizada", pausada: "En pausa" },
};

export function textosStatusEditorial(idioma: HistorietasLanguage) {
  return textos[idioma];
}

// A propriedade ausente nunca equivale a um NULL confirmado.
export function statusEditorialRemoto(registro: Record<string, unknown>) {
  if (!Object.hasOwn(registro, "status_editorial")) return undefined;
  const valor = registro.status_editorial;
  return valor === null || ehStatusEditorial(valor) ? valor : undefined;
}

export type ConfirmacaoEditorial = Readonly<{
  id: string;
  userId: string;
  status: StatusEditorial | null;
  versao: string | null;
}>;

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function confirmarEditorialRemoto(
  valor: unknown, id: string, userId: string,
): ConfirmacaoEditorial | null {
  if (!valor || typeof valor !== "object") return null;
  const row = valor as Record<string, unknown>;
  const status = statusEditorialRemoto(row);
  if (row.id !== id || row.user_id !== userId || status === undefined ||
      !Object.hasOwn(row, "status_editorial_versao") ||
      !(row.status_editorial_versao === null ||
        (typeof row.status_editorial_versao === "string" && uuid.test(row.status_editorial_versao)))) return null;
  return { id, userId, status, versao: row.status_editorial_versao as string | null };
}
