import {
  useEffect,
  useRef,
  type Dispatch,
  type KeyboardEvent,
  type SetStateAction,
} from "react";
import {
  focarInicioDialogo,
  manterFocoNoDialogo,
  obterElementoComFocoAtual,
  restaurarFocoAnterior,
} from "../../obra/[slug]/lib/obra-dialog-focus";

type UseListasDiaryCommentsSheetLifecycleParams<TItem> = {
  comentariosDiarioItem: TItem | null;
  setComentariosDiarioItem: Dispatch<SetStateAction<TItem | null>>;
  setComentariosDiarioExpandido: Dispatch<SetStateAction<boolean>>;
  setMenuOrdenacaoComentariosDiarioAberto: Dispatch<SetStateAction<boolean>>;
};

export function useListasDiaryCommentsSheetLifecycle<TItem>({
  comentariosDiarioItem,
  setComentariosDiarioItem,
  setComentariosDiarioExpandido,
  setMenuOrdenacaoComentariosDiarioAberto,
}: UseListasDiaryCommentsSheetLifecycleParams<TItem>) {
  const comentariosSheetRef = useRef<HTMLElement | null>(null);

  function fecharComentariosDiarioPorTeclado() {
    setComentariosDiarioItem(null);
    setComentariosDiarioExpandido(false);
    setMenuOrdenacaoComentariosDiarioAberto(false);
  }

  function aoPressionarTeclaDialogo(event: KeyboardEvent<HTMLElement>) {
    manterFocoNoDialogo(event, fecharComentariosDiarioPorTeclado);
  }

  useEffect(() => {
    if (!comentariosDiarioItem) {
      return;
    }

    const overflowAnterior = document.body.style.overflow;
    const elementoComFocoAnterior = obterElementoComFocoAtual();
    const focoInicialTimer = window.setTimeout(() => {
      focarInicioDialogo(comentariosSheetRef.current);
    }, 0);

    document.body.style.overflow = "hidden";

    return () => {
      window.clearTimeout(focoInicialTimer);
      document.body.style.overflow = overflowAnterior;
      restaurarFocoAnterior(elementoComFocoAnterior);
    };
  }, [comentariosDiarioItem]);

  return {
    aoPressionarTeclaDialogo,
    comentariosSheetRef,
  };
}
