"use client";

import { useHistorietasLanguage } from "../../../components/HistorietasLanguageProvider";
import { useNotificacoes } from "../../../components/NotificacoesProvider";
import { useHistorietasTheme } from "../../../lib/historietasTheme";
import type {
  ResumoLocal,
  UsuarioConfiguracoes,
} from "../lib/configuracoes-account-models";
import { pageStyle } from "../lib/configuracoes-security-styles";
import { useConfiguracoesPageViewModel } from "./use-configuracoes-page-view-model";

export function useConfiguracoesPagePresentation({
  busca,
  resumo,
  usuario,
}: {
  busca: string;
  resumo: ResumoLocal;
  usuario: UsuarioConfiguracoes | null;
}) {
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const { notificacoesNaoLidas } = useNotificacoes();
  const { language } = useHistorietasLanguage();
  const usuarioIdLogado = usuario?.id || "";
  const { t, deveMostrar, totalBiblioteca } =
    useConfiguracoesPageViewModel({
      language,
      busca,
      resumo,
    });

  return {
    pageThemeStyle,
    notificacoesNaoLidas,
    language,
    usuarioIdLogado,
    t,
    deveMostrar,
    totalBiblioteca,
  };
}
