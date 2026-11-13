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

    // O debounce adia a consulta, mas não deve manter sugestões do termo ou
    // da conta anterior visíveis enquanto a nova busca está pendente.
    const timerEstado = window.setTimeout(() => {
      if (!cancelado) {
        setUsuariosSugestoesBusca([]);
        setCarregandoUsuariosSugestoes(
          buscaSugestoesUsuariosAtiva && Boolean(usuarioLogadoId),
        );
      }
    }, 0);

    const timerBusca = window.setTimeout(
      () => {
        if (cancelado) {
          return;
        }

        if (!buscaSugestoesUsuariosAtiva || !usuarioLogadoId) {
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
          .catch(() => {
            if (!cancelado) {
              setUsuariosSugestoesBusca([]);
            }
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
      window.clearTimeout(timerEstado);
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
