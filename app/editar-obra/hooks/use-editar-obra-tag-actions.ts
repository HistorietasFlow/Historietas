import type { Dispatch, SetStateAction } from "react";
import {
  LIMITE_CARACTERES_TAG_PERSONALIZADA,
  OUTRA_TAG_VALUE,
} from "../lib/editar-obra-form-config";
import {
  prepararAtualizacaoTagPersonalizada,
  prepararSelecaoTagEdicaoObra,
} from "../lib/editar-obra-tag-utils";

type UseEditarObraTagActionsProps = {
  tagPersonalizada: string;
  marcarAlteracao: () => void;
  setTagPersonalizada: Dispatch<SetStateAction<string>>;
  setTags: Dispatch<SetStateAction<string>>;
  setUsarTagPersonalizada: Dispatch<SetStateAction<boolean>>;
};

export function useEditarObraTagActions({
  tagPersonalizada,
  marcarAlteracao,
  setTagPersonalizada,
  setTags,
  setUsarTagPersonalizada,
}: UseEditarObraTagActionsProps) {
  function atualizarTagPersonalizada(valor: string) {
    const proximaTag = prepararAtualizacaoTagPersonalizada(
      valor,
      LIMITE_CARACTERES_TAG_PERSONALIZADA
    );

    setTagPersonalizada(proximaTag.tagPersonalizada);
    setTags(proximaTag.tags);
    marcarAlteracao();
  }

  function adicionarTagSelecionada(tag: string) {
    const proximaTag = prepararSelecaoTagEdicaoObra(
      tag,
      tagPersonalizada,
      OUTRA_TAG_VALUE,
      LIMITE_CARACTERES_TAG_PERSONALIZADA,
    );

    setUsarTagPersonalizada(proximaTag.usarTagPersonalizada);

    if (proximaTag.tagPersonalizada !== undefined) {
      setTagPersonalizada(proximaTag.tagPersonalizada);
    }

    setTags(proximaTag.tags);
    marcarAlteracao();
  }

  return {
    atualizarTagPersonalizada,
    adicionarTagSelecionada,
  };
}
