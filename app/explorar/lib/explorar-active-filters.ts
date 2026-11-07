import type {
  FiltroColecaoExplorar,
  OrdenacaoExplorar,
} from "./explorar-derived-utils";

export function possuiFiltrosAtivosExplorar({
  categoriaSelecionada,
  termoBusca,
  filtroFormato,
  filtroTag = "",
  tagExcluida = "",
  generoExcluido = "",
  notaMinima = null,
  filtroClassificacao,
  filtroCapitulos,
  usuarioLogado,
  filtroColecao,
  ordenacao,
}: {
  categoriaSelecionada: string;
  termoBusca: string;
  filtroFormato: string;
  filtroTag?: string;
  tagExcluida?: string;
  generoExcluido?: string;
  notaMinima?: number | null;
  filtroClassificacao: string;
  filtroCapitulos: string;
  usuarioLogado: boolean;
  filtroColecao: FiltroColecaoExplorar;
  ordenacao: OrdenacaoExplorar;
}) {
  return Boolean(
    categoriaSelecionada ||
      termoBusca ||
      filtroFormato !== "todos" ||
      filtroTag ||
      tagExcluida ||
      generoExcluido ||
      notaMinima !== null ||
      filtroClassificacao !== "todos" ||
      filtroCapitulos !== "todos" ||
      (usuarioLogado && filtroColecao !== "todos") ||
      ordenacao !== "relevancia"
  );
}
