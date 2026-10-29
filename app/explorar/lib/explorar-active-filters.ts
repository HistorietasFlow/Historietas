import type {
  FiltroColecaoExplorar,
  OrdenacaoExplorar,
} from "./explorar-derived-utils";

export function possuiFiltrosAtivosExplorar({
  categoriaSelecionada,
  termoBusca,
  filtroFormato,
  filtroClassificacao,
  filtroCapitulos,
  usuarioLogado,
  filtroColecao,
  ordenacao,
}: {
  categoriaSelecionada: string;
  termoBusca: string;
  filtroFormato: string;
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
      filtroClassificacao !== "todos" ||
      filtroCapitulos !== "todos" ||
      (usuarioLogado && filtroColecao !== "todos") ||
      ordenacao !== "relevancia"
  );
}
