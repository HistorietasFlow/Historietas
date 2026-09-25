import type { Dispatch, SetStateAction } from "react";

type SelecionarObraRelacionadaParams = {
  titulo: string;
  setObraRelacionadaBusca: Dispatch<SetStateAction<string>>;
  setSugestoesObrasAbertas: Dispatch<SetStateAction<boolean>>;
  obraRelacionadaRef: { current: HTMLInputElement | null };
};

export function selecionarObraRelacionada({
  titulo,
  setObraRelacionadaBusca,
  setSugestoesObrasAbertas,
  obraRelacionadaRef,
}: SelecionarObraRelacionadaParams) {
  setObraRelacionadaBusca(titulo);
  setSugestoesObrasAbertas(false);

  if (obraRelacionadaRef.current) {
    obraRelacionadaRef.current.value = titulo;
    obraRelacionadaRef.current.focus();
  }
}
