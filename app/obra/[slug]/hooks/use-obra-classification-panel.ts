import { useCallback, useRef, useState } from "react";
import {
  obterElementoComFocoAtual,
  restaurarFocoAnterior,
} from "../lib/obra-dialog-focus";
import { useObraDialogInitialFocus } from "./use-obra-dialog-initial-focus";

export function useObraClassificationPanel() {
  const [painelClassificacaoAberto, setPainelClassificacaoAberto] =
    useState(false);
  const classificacaoDialogRef = useRef<HTMLElement | null>(null);
  const focoAntesClassificacaoRef = useRef<HTMLElement | null>(null);

  useObraDialogInitialFocus(
    painelClassificacaoAberto,
    classificacaoDialogRef,
  );

  function abrirPainelClassificacaoObra() {
    focoAntesClassificacaoRef.current = obterElementoComFocoAtual();
    setPainelClassificacaoAberto(true);
  }

  function fecharPainelClassificacaoObra() {
    const focoAnterior = focoAntesClassificacaoRef.current;
    focoAntesClassificacaoRef.current = null;
    setPainelClassificacaoAberto(false);
    restaurarFocoAnterior(focoAnterior);
  }

  const resetarPainelClassificacaoObra = useCallback(() => {
    setPainelClassificacaoAberto(false);
  }, []);

  return {
    painelClassificacaoAberto,
    classificacaoDialogRef,
    abrirPainelClassificacaoObra,
    fecharPainelClassificacaoObra,
    resetarPainelClassificacaoObra,
  };
}
