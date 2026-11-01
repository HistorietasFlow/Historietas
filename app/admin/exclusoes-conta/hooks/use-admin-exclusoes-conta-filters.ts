"use client";

import { useMemo, useState } from "react";
import type { HistorietasLanguage } from "../../../../lib/i18n";
import { filtrarSolicitacoesExclusao } from "../lib/admin-exclusoes-conta-filter-utils";
import type {
  FiltroStatus,
  SolicitacaoExclusao,
} from "../lib/admin-exclusoes-conta-normalization-utils";

type UseAdminExclusoesContaFiltersParams = {
  solicitacoes: SolicitacaoExclusao[];
  language: HistorietasLanguage;
};

export function useAdminExclusoesContaFilters({
  solicitacoes,
  language,
}: UseAdminExclusoesContaFiltersParams) {
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<FiltroStatus>("todos");

  const solicitacoesFiltradas = useMemo(
    () =>
      filtrarSolicitacoesExclusao({
        solicitacoes,
        busca,
        statusFiltro,
        language,
      }),
    [busca, language, solicitacoes, statusFiltro],
  );

  return {
    busca,
    setBusca,
    statusFiltro,
    setStatusFiltro,
    solicitacoesFiltradas,
  };
}
