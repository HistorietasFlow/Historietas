import { useRef, useState } from "react";
import {
  obterElementoComFocoAtual,
  restaurarFocoAnterior,
} from "../lib/obra-dialog-focus";
import { useObraDialogInitialFocus } from "./use-obra-dialog-initial-focus";

export function useObraActionsSheet() {
  const [acoesObraAbertas, setAcoesObraAbertas] = useState(false);
  const acoesObraDialogRef = useRef<HTMLElement | null>(null);
  const focoAntesAcoesObraRef = useRef<HTMLElement | null>(null);

  useObraDialogInitialFocus(acoesObraAbertas, acoesObraDialogRef);

  function abrirAcoesObra() {
    focoAntesAcoesObraRef.current = obterElementoComFocoAtual();
    setAcoesObraAbertas(true);
  }

  function fecharAcoesObra(restaurarFoco = true) {
    const focoAnterior = focoAntesAcoesObraRef.current;
    focoAntesAcoesObraRef.current = null;
    setAcoesObraAbertas(false);

    if (restaurarFoco) {
      restaurarFocoAnterior(focoAnterior);
    }
  }

  function alternarAcoesObra() {
    if (acoesObraAbertas) {
      fecharAcoesObra();
      return;
    }

    abrirAcoesObra();
  }

  return {
    acoesObraAbertas,
    setAcoesObraAbertas,
    acoesObraDialogRef,
    abrirAcoesObra,
    fecharAcoesObra,
    alternarAcoesObra,
  };
}
