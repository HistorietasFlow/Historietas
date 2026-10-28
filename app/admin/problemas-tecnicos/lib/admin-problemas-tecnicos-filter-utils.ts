import type { HistorietasLanguage } from "../../../../lib/i18n";
import { normalizarTexto } from "../../../../lib/utils";
import {
  CATEGORIA_LABEL,
  PRIORIDADE_LABEL,
  STATUS_LABEL,
  traduzir,
} from "./admin-problemas-tecnicos-text-utils";
import type {
  FiltroStatusProblema,
  ProblemaTecnico,
} from "./admin-problemas-tecnicos-normalization-utils";

export function filtrarProblemasTecnicos({
  problemas,
  busca,
  statusFiltro,
  nomesUsuarios,
  language,
}: {
  problemas: ProblemaTecnico[];
  busca: string;
  statusFiltro: FiltroStatusProblema;
  nomesUsuarios: Record<string, string>;
  language: HistorietasLanguage;
}) {
  const termo = normalizarTexto(busca);

  return problemas.filter((problema) => {
    if (statusFiltro !== "todos" && problema.status !== statusFiltro) {
      return false;
    }

    if (!termo) {
      return true;
    }

    const conteudo = normalizarTexto(
      [
        problema.titulo,
        problema.descricao,
        problema.emailContato,
        problema.paginaUrl,
        problema.navegador,
        problema.dispositivo,
        nomesUsuarios[problema.userId] || "",
        traduzir(CATEGORIA_LABEL[problema.categoria], language),
        traduzir(STATUS_LABEL[problema.status], language),
        traduzir(PRIORIDADE_LABEL[problema.prioridade], language),
      ].join(" "),
    );

    return conteudo.includes(termo);
  });
}
