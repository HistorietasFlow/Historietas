import type {
  FiltroColecaoExplorar,
  OrdenacaoExplorar,
} from "./explorar-derived-utils";

export function possuiFiltrosAtivosExplorar({
  categoriaSelecionada,
  termoBusca,
  filtroFormato,
  filtroTag = "",
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
      filtroClassificacao !== "todos" ||
      filtroCapitulos !== "todos" ||
      (usuarioLogado && filtroColecao !== "todos") ||
      ordenacao !== "relevancia"
  );
}
