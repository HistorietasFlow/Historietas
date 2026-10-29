import type {
  FiltroColecaoExplorar,
  OrdenacaoExplorar,
} from "./explorar-derived-utils";

export function contarFiltrosAvancadosAtivosExplorar({
  usuarioLogado,
  filtroColecao,
  filtroFormato,
  filtroClassificacao,
  filtroCapitulos,
  ordenacao,
}: {
  usuarioLogado: boolean;
  filtroColecao: FiltroColecaoExplorar;
  filtroFormato: string;
  filtroClassificacao: string;
  filtroCapitulos: string;
  ordenacao: OrdenacaoExplorar;
}) {
  return [
    usuarioLogado && filtroColecao !== "todos",
    filtroFormato !== "todos",
    filtroClassificacao !== "todos",
    filtroCapitulos !== "todos",
    ordenacao !== "relevancia",
  ].filter(Boolean).length;
}
