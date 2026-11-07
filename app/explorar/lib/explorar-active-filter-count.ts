import type {
  FiltroColecaoExplorar,
  OrdenacaoExplorar,
} from "./explorar-derived-utils";

export function contarFiltrosAvancadosAtivosExplorar({
  usuarioLogado,
  filtroColecao,
  filtroFormato,
  filtroTag = "",
  tagExcluida = "",
  generoExcluido = "",
  notaMinima = null,
  filtroClassificacao,
  filtroCapitulos,
  ordenacao,
}: {
  usuarioLogado: boolean;
  filtroColecao: FiltroColecaoExplorar;
  filtroFormato: string;
  filtroTag?: string;
  tagExcluida?: string;
  generoExcluido?: string;
  notaMinima?: number | null;
  filtroClassificacao: string;
  filtroCapitulos: string;
  ordenacao: OrdenacaoExplorar;
}) {
  return [
    usuarioLogado && filtroColecao !== "todos",
    filtroFormato !== "todos",
    Boolean(filtroTag),
    Boolean(tagExcluida),
    Boolean(generoExcluido),
    notaMinima !== null,
    filtroClassificacao !== "todos",
    filtroCapitulos !== "todos",
    ordenacao !== "relevancia",
  ].filter(Boolean).length;
}
