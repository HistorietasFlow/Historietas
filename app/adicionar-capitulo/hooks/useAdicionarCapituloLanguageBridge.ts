import { useEffect, type RefObject } from "react";
import type { HistorietasLanguage } from "../../../lib/i18n";
import { traduzirElementoAdicionarCapitulo } from "../lib/adicionar-capitulo-language-bridge";

type UseAdicionarCapituloLanguageBridgeParams = {
  raizTraducaoRef: RefObject<HTMLElement | null>;
  language: HistorietasLanguage;
  carregando: boolean;
  obraAtual: unknown;
};

export function useAdicionarCapituloLanguageBridge({
  raizTraducaoRef,
  language,
  carregando,
  obraAtual,
}: UseAdicionarCapituloLanguageBridgeParams) {
  useEffect(() => {
    const raiz = raizTraducaoRef.current;

    if (!raiz) {
      return;
    }

    let atualizacaoAgendada = false;

    const aplicarTraducao = () => {
      atualizacaoAgendada = false;

      if (raizTraducaoRef.current) {
        traduzirElementoAdicionarCapitulo(
          raizTraducaoRef.current,
          language
        );
      }
    };

    traduzirElementoAdicionarCapitulo(raiz, language);

    const observer = new MutationObserver(() => {
      if (atualizacaoAgendada) {
        return;
      }

      atualizacaoAgendada = true;
      queueMicrotask(aplicarTraducao);
    });

    observer.observe(raiz, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["aria-label", "title", "placeholder", "alt"],
    });

    return () => {
      observer.disconnect();
    };
  }, [language, carregando, obraAtual]);
}
