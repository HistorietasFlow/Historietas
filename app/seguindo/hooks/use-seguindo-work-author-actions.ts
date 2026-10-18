"use client";

import type { Dispatch, SetStateAction } from "react";
import { removerObraDaLista } from "../lib/seguindo-work-collection-utils";
import { sincronizarObraUsuarioSupabase } from "../lib/seguindo-work-sync-utils";
import {
  AUTHOR_FOLLOW_STORAGE_KEY,
  FOLLOW_STORAGE_KEY,
  salvarJsonStorageUsuarioSeguindo,
} from "../lib/seguindo-storage-utils";

type ObraSeguindo = {
  id: string;
  titulo: string;
  slug: string;
  link: string;
};

type UseSeguindoWorkAuthorActionsParams = {
  usuarioLogadoId: string;
  obrasSeguidas: string[];
  autoresSeguidos: string[];
  setObrasSeguidas: Dispatch<SetStateAction<string[]>>;
  setAutoresSeguidos: Dispatch<SetStateAction<string[]>>;
};

export function useSeguindoWorkAuthorActions({
  usuarioLogadoId,
  obrasSeguidas,
  autoresSeguidos,
  setObrasSeguidas,
  setAutoresSeguidos,
}: UseSeguindoWorkAuthorActionsParams) {
  function deixarDeSeguirObra(obra: ObraSeguindo) {
    const novasObrasSeguidas = removerObraDaLista(obra, obrasSeguidas);

    salvarJsonStorageUsuarioSeguindo(
      FOLLOW_STORAGE_KEY,
      usuarioLogadoId,
      novasObrasSeguidas,
    );

    setObrasSeguidas(novasObrasSeguidas);
    void sincronizarObraUsuarioSupabase("seguindo_obras", obra.id, false);
  }

  function deixarDeSeguirAutor(autorChave: string) {
    const novosAutoresSeguidos = autoresSeguidos.filter(
      (autor) => autor !== autorChave,
    );

    salvarJsonStorageUsuarioSeguindo(
      AUTHOR_FOLLOW_STORAGE_KEY,
      usuarioLogadoId,
      novosAutoresSeguidos,
    );

    setAutoresSeguidos(novosAutoresSeguidos);
  }

  return {
    deixarDeSeguirObra,
    deixarDeSeguirAutor,
  };
}
