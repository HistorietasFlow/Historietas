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
  statusEditorial = "",
  notaMinima = null,
  palavrasAtivas = false,
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
  statusEditorial?: string;
  notaMinima?: number | null;
  palavrasAtivas?: boolean;
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
    Boolean(statusEditorial),
    notaMinima !== null,
    palavrasAtivas,
    filtroClassificacao !== "todos",
    filtroCapitulos !== "todos",
    ordenacao !== "relevancia",
  ].filter(Boolean).length;
}
