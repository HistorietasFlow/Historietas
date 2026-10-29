"use client";

import {
  useEffect,
  type Dispatch,
  type SetStateAction,
} from "react";
import { obterAutorIdsExplorar } from "../lib/explorar-author-ids";
import {
  carregarPerfisAutoresExplorar,
  carregarAvaliacoesAutoresExplorar,
} from "../lib/explorar-author-profile-utils";
import type {
  PerfisAutoresExplorar,
  AvaliacoesAutoresExplorar,
} from "../lib/explorar-author-profile-utils";
import type { ObraLocal } from "../lib/explorar-work-normalizers";

type UseExplorarAuthorDataParams = {
  obrasLocais: ObraLocal[];
  setPerfisAutores: Dispatch<SetStateAction<PerfisAutoresExplorar>>;
  setAvaliacoesAutores: Dispatch<SetStateAction<AvaliacoesAutoresExplorar>>;
};

export function useExplorarAuthorData({
  obrasLocais,
  setPerfisAutores,
  setAvaliacoesAutores,
}: UseExplorarAuthorDataParams) {
  useEffect(() => {
    const autorIds = obterAutorIdsExplorar(obrasLocais);

    let cancelado = false;

    async function carregarDadosAutores() {
      if (autorIds.length === 0) {
        await Promise.resolve();

        if (!cancelado) {
          setPerfisAutores({});
          setAvaliacoesAutores({});
        }

        return;
      }

      const [perfis, avaliacoes] = await Promise.all([
        carregarPerfisAutoresExplorar(autorIds),
        carregarAvaliacoesAutoresExplorar(autorIds),
      ]);

      if (!cancelado) {
        setPerfisAutores(perfis);
        setAvaliacoesAutores(avaliacoes);
      }
    }

    void carregarDadosAutores();

    return () => {
      cancelado = true;
    };
  }, [
    obrasLocais,
    setPerfisAutores,
    setAvaliacoesAutores,
  ]);
}
