import type { Dispatch, SetStateAction } from "react";
import type { CategoriaComunidade } from "./community-category";
import { MODELO_ENQUETE_COMUNIDADE } from "./community-poll-constants";
import type { TipoPublicacaoComunidade } from "./community-publication-type";

type PrepararEnqueteComunidadeParams = {
  garantirAceiteAntesDePublicarComunidade: () => Promise<boolean>;
  setErro: Dispatch<SetStateAction<string>>;
  setCategoriaPost: Dispatch<SetStateAction<CategoriaComunidade>>;
  setTipoPublicacaoPost: Dispatch<SetStateAction<TipoPublicacaoComunidade>>;
  setTemSpoilerPost: Dispatch<SetStateAction<boolean>>;
  setComposerAberto: Dispatch<SetStateAction<boolean>>;
  textoPostRef: { current: HTMLTextAreaElement | null };
};

export async function prepararEnqueteComunidade({
  garantirAceiteAntesDePublicarComunidade,
  setErro,
  setCategoriaPost,
  setTipoPublicacaoPost,
  setTemSpoilerPost,
  setComposerAberto,
  textoPostRef,
}: PrepararEnqueteComunidadeParams) {
  if (!(await garantirAceiteAntesDePublicarComunidade())) {
    return;
  }

  setErro("");
  setCategoriaPost("Discussão");
  setTipoPublicacaoPost("Enquete");
  setTemSpoilerPost(false);
  setComposerAberto(true);

  window.setTimeout(() => {
    if (!textoPostRef.current) {
      return;
    }

    textoPostRef.current.value = MODELO_ENQUETE_COMUNIDADE;
    textoPostRef.current.focus();
    textoPostRef.current.setSelectionRange(
      textoPostRef.current.value.length,
      textoPostRef.current.value.length
    );
  }, 0);
}
