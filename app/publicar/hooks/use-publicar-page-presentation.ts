"use client";

import { useHistorietasLanguage } from "../../../components/HistorietasLanguageProvider";
import { useHistorietasTheme } from "../../../lib/historietasTheme";
import {
  obterTextoPublicar,
  traduzirClassificacaoPublicar,
  traduzirMensagemPublicar,
  type ChaveTextoPublicar,
} from "../lib/publicar-translations";
import { pageStyle } from "../lib/publicar-layout-styles";

export function usePublicarPagePresentation() {
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const { language: idioma } = useHistorietasLanguage();
  const t = (chave: ChaveTextoPublicar) => obterTextoPublicar(idioma, chave);
  const traduzirMensagem = (mensagem: string) =>
    traduzirMensagemPublicar(idioma, mensagem);
  const traduzirClassificacao = (classificacao: string) =>
    traduzirClassificacaoPublicar(idioma, classificacao);

  return {
    pageThemeStyle,
    idioma,
    t,
    traduzirMensagem,
    traduzirClassificacao,
  };
}
