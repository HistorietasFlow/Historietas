"use client";

import { useMemo } from "react";
import type { HistorietasLanguage } from "../../../lib/i18n";
import type { ResumoLocal } from "../lib/configuracoes-account-models";
import { calcularTotalBibliotecaConfiguracoes } from "../lib/configuracoes-account-preference-state-utils";
import {
  normalizarTextoBuscaConfiguracoes,
  textoIdioma,
} from "../lib/configuracoes-search-utils";
import { deveMostrarSecaoConfiguracoes } from "../lib/configuracoes-search-visibility-utils";

export function useConfiguracoesPageViewModel({
  language,
  busca,
  resumo,
}: {
  language: HistorietasLanguage;
  busca: string;
  resumo: ResumoLocal;
}) {
  function t(portugues: string, ingles: string, espanhol: string) {
    return textoIdioma(language, portugues, ingles, espanhol);
  }

  const buscaNormalizada = normalizarTextoBuscaConfiguracoes(busca);

  const deveMostrar = (...termos: string[]) =>
    deveMostrarSecaoConfiguracoes(buscaNormalizada, ...termos);

  const totalBiblioteca = useMemo(
    () =>
      calcularTotalBibliotecaConfiguracoes(
        resumo.favoritas,
        resumo.concluidas,
        resumo.seguindoObras,
      ),
    [resumo.concluidas, resumo.favoritas, resumo.seguindoObras],
  );

  return {
    t,
    deveMostrar,
    totalBiblioteca,
  };
}
