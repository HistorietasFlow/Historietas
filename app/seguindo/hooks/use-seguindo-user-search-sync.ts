"use client";

import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { buscarUsuariosParaSeguirSupabase } from "../lib/seguindo-user-search-utils";

type UsuarioBuscaSeguindo = {
  id: string;
  nome: string;
  handle: string;
  bio: string;
  avatar: string;
  criadoEm: string;
};

type UseSeguindoUserSearchSyncParams = {
  busca: string;
  buscaSugestoesUsuariosAtiva: boolean;
  usuarioLogadoId: string;
  usuariosSeguidos: UsuarioBuscaSeguindo[];
  setUsuariosSugestoesBusca: Dispatch<
    SetStateAction<UsuarioBuscaSeguindo[]>
  >;
  setCarregandoUsuariosSugestoes: Dispatch<SetStateAction<boolean>>;
};

export function useSeguindoUserSearchSync({
  busca,
  buscaSugestoesUsuariosAtiva,
  usuarioLogadoId,
  usuariosSeguidos,
  setUsuariosSugestoesBusca,
  setCarregandoUsuariosSugestoes,
}: UseSeguindoUserSearchSyncParams) {
  useEffect(() => {
    let cancelado = false;

    const timerBusca = window.setTimeout(
      () => {
        if (cancelado) {
          return;
        }

        if (!buscaSugestoesUsuariosAtiva) {
          setUsuariosSugestoesBusca([]);
          setCarregandoUsuariosSugestoes(false);
          return;
        }

        setCarregandoUsuariosSugestoes(true);

        void buscarUsuariosParaSeguirSupabase(busca)
          .then((usuariosEncontrados) => {
            if (cancelado) {
              return;
            }

            const idsJaSeguidos = new Set(
              usuariosSeguidos.map((usuarioSeguido) => usuarioSeguido.id),
            );

            setUsuariosSugestoesBusca(
              usuariosEncontrados.filter((usuarioEncontrado) => {
                return (
                  usuarioEncontrado.id !== usuarioLogadoId &&
                  !idsJaSeguidos.has(usuarioEncontrado.id)
                );
              }),
            );
          })
          .finally(() => {
            if (!cancelado) {
              setCarregandoUsuariosSugestoes(false);
            }
          });
      },
      buscaSugestoesUsuariosAtiva ? 220 : 0,
    );

    return () => {
      cancelado = true;
      window.clearTimeout(timerBusca);
    };
  }, [
    busca,
    buscaSugestoesUsuariosAtiva,
    setCarregandoUsuariosSugestoes,
    setUsuariosSugestoesBusca,
    usuarioLogadoId,
    usuariosSeguidos,
  ]);
}
