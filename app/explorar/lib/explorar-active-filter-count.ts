import type {
  FiltroColecaoExplorar,
  OrdenacaoExplorar,
} from "./explorar-derived-utils";

export function contarFiltrosAvancadosAtivosExplorar({
  usuarioLogado,
  filtroColecao,
  filtroFormato,
  filtroTag = "",
  notaMinima = null,
  filtroClassificacao,
  filtroCapitulos,
  ordenacao,
}: {
  usuarioLogado: boolean;
  filtroColecao: FiltroColecaoExplorar;
  filtroFormato: string;
  filtroTag?: string;
  notaMinima?: number | null;
  filtroClassificacao: string;
  filtroCapitulos: string;
  ordenacao: OrdenacaoExplorar;
}) {
  return [
    usuarioLogado && filtroColecao !== "todos",
    filtroFormato !== "todos",
    Boolean(filtroTag),
    notaMinima !== null,
    filtroClassificacao !== "todos",
    filtroCapitulos !== "todos",
    ordenacao !== "relevancia",
  ].filter(Boolean).length;
}
