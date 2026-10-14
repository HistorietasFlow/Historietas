import { useEffect, type Dispatch, type SetStateAction } from "react";

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
  useEffect(() => {
    if (!comentariosDiarioItem) {
      return;
    }

    const overflowAnterior = document.body.style.overflow;
    const aoPressionarTecla = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setComentariosDiarioItem(null);
        setComentariosDiarioExpandido(false);
        setMenuOrdenacaoComentariosDiarioAberto(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", aoPressionarTecla);

    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", aoPressionarTecla);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Preserva as dependências do efeito original.
  }, [comentariosDiarioItem]);
}
