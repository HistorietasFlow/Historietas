import type { HistorietasLanguage } from "../../../../lib/i18n";
import { normalizarTexto } from "../../../../lib/utils";
import type {
  FiltroStatus,
  SolicitacaoExclusao,
} from "./admin-exclusoes-conta-normalization-utils";
import {
  STATUS_LABEL,
  origemTraduzida,
  traduzir,
} from "./admin-exclusoes-conta-text-utils";

type ParametrosFiltroSolicitacoesExclusao = {
  solicitacoes: SolicitacaoExclusao[];
  busca: string;
  statusFiltro: FiltroStatus;
  language: HistorietasLanguage;
};

export function filtrarSolicitacoesExclusao({
  solicitacoes,
  busca,
  statusFiltro,
  language,
}: ParametrosFiltroSolicitacoesExclusao) {
  const termo = normalizarTexto(busca);

  return solicitacoes.filter((solicitacao) => {
    if (
      statusFiltro !== "todos" &&
      solicitacao.status !== statusFiltro
    ) {
      return false;
    }

    if (!termo) {
      return true;
    }

    const conteudo = normalizarTexto(
      [
        solicitacao.email,
        solicitacao.motivo,
        solicitacao.origem,
        solicitacao.status,
        solicitacao.userAgent,
        solicitacao.observacaoInterna,
        origemTraduzida(solicitacao.origem, language),
        traduzir(STATUS_LABEL[solicitacao.status], language),
      ].join(" "),
    );

    return conteudo.includes(termo);
  });
}
