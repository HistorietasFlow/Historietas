import { useEffect, type Dispatch, type SetStateAction } from "react";

type UseListasWorkMenuLifecycleParams<TObra, TItem, TEditor> = {
  obraMenuAberta: TObra | null;
  setObraMenuAberta: Dispatch<SetStateAction<TObra | null>>;
  setItemPerfilMenuAberto: Dispatch<SetStateAction<TItem | null>>;
  setObraMenuNoQueroLer: Dispatch<SetStateAction<boolean>>;
  setEditorAnotacao: Dispatch<SetStateAction<TEditor>>;
  editorAnotacaoVazio: TEditor;
};

export function useListasWorkMenuLifecycle<TObra, TItem, TEditor>({
  obraMenuAberta,
  setObraMenuAberta,
  setItemPerfilMenuAberto,
  setObraMenuNoQueroLer,
  setEditorAnotacao,
  editorAnotacaoVazio,
}: UseListasWorkMenuLifecycleParams<TObra, TItem, TEditor>) {
  useEffect(() => {
    if (!obraMenuAberta) {
      return;
    }

    const overflowAnterior = document.body.style.overflow;
    const aoPressionarTecla = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setObraMenuAberta(null);
        setItemPerfilMenuAberto(null);
        setObraMenuNoQueroLer(false);
        setEditorAnotacao(editorAnotacaoVazio);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", aoPressionarTecla);

    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", aoPressionarTecla);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Preserva as dependências do efeito original.
  }, [obraMenuAberta]);
}
