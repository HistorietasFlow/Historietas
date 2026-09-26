import type { Dispatch, SetStateAction } from "react";

type AbrirBuscaComunidadeParams = {
  setBuscaComunidadeAberta: Dispatch<SetStateAction<boolean>>;
};

type FecharBuscaComunidadeParams = {
  setTermoBusca: Dispatch<SetStateAction<string>>;
  setBuscaComunidadeAberta: Dispatch<SetStateAction<boolean>>;
};

export function abrirBuscaComunidade({
  setBuscaComunidadeAberta,
}: AbrirBuscaComunidadeParams): void {
  setBuscaComunidadeAberta(true);
}

export function fecharBuscaComunidade({
  setTermoBusca,
  setBuscaComunidadeAberta,
}: FecharBuscaComunidadeParams): void {
  setTermoBusca("");
  setBuscaComunidadeAberta(false);
}
