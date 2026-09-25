import type { Dispatch, SetStateAction } from "react";

type AbrirPublicacaoRapidaComunidadeParams = {
  carregandoUsuario: boolean;
  garantirAceiteAntesDePublicarComunidade: () => Promise<boolean>;
  setMenuAcoesRapidasComunidadeAberto: Dispatch<SetStateAction<boolean>>;
  setErro: Dispatch<SetStateAction<string>>;
  setComposerAberto: Dispatch<SetStateAction<boolean>>;
};

export async function abrirPublicacaoRapidaComunidade({
  carregandoUsuario,
  garantirAceiteAntesDePublicarComunidade,
  setMenuAcoesRapidasComunidadeAberto,
  setErro,
  setComposerAberto,
}: AbrirPublicacaoRapidaComunidadeParams) {
  setMenuAcoesRapidasComunidadeAberto(false);

  if (
    carregandoUsuario ||
    !(await garantirAceiteAntesDePublicarComunidade())
  ) {
    return;
  }

  setErro("");
  setComposerAberto(true);
}
