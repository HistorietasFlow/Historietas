"use client";

import { useMemo, useState } from "react";
import type { HistorietasLanguage } from "../../../../lib/i18n";
import { filtrarProblemasTecnicos } from "../lib/admin-problemas-tecnicos-filter-utils";
import type {
  FiltroStatusProblema,
  ProblemaTecnico,
} from "../lib/admin-problemas-tecnicos-normalization-utils";

type UseAdminProblemasTecnicosFiltersParams = {
  problemas: ProblemaTecnico[];
  nomesUsuarios: Record<string, string>;
  language: HistorietasLanguage;
};

export function useAdminProblemasTecnicosFilters({
  problemas,
  nomesUsuarios,
  language,
}: UseAdminProblemasTecnicosFiltersParams) {
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] =
    useState<FiltroStatusProblema>("todos");

  const problemasFiltrados = useMemo(
    () =>
      filtrarProblemasTecnicos({
        problemas,
        busca,
        statusFiltro,
        nomesUsuarios,
        language,
      }),
    [busca, language, nomesUsuarios, problemas, statusFiltro],
  );

  return {
    busca,
    setBusca,
    statusFiltro,
    setStatusFiltro,
    problemasFiltrados,
  };
}
