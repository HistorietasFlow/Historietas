"use client";

import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { deveLimparBuscaUsuariosComunidade } from "../components/community-user-search-clear-check";
import { buscarUsuariosComunidadeNosPosts } from "../components/community-post-user-search";
import { prepararResultadosBuscaUsuariosComunidade } from "../components/community-user-search-results-preparation";
import { normalizarTermoBuscaUsuariosComunidade } from "../components/community-user-search-term-normalizer";
import { buscarUsuariosComunidadeSupabase } from "../components/community-supabase-user-search";
import { carregarUsuariosSeguidosComunidade } from "../components/community-supabase-followed-users-loader";
import type { PostComunidade } from "../components/community-post-model";
import type { UsuarioBuscaComunidade } from "../components/community-user";

type UseComunidadeUserSearchSyncOptions = {
  buscaComunidadeAberta: boolean;
  posts: PostComunidade[];
  termoBuscaAdiado: string;
  usuarioId: string | undefined;
  setUsuariosBuscaComunidade: Dispatch<SetStateAction<UsuarioBuscaComunidade[]>>;
  setCarregandoUsuariosBuscaComunidade: Dispatch<SetStateAction<boolean>>;
  setUsuariosSeguidosIds: Dispatch<SetStateAction<string[]>>;
};

export function useComunidadeUserSearchSync({
  buscaComunidadeAberta,
  posts,
  termoBuscaAdiado,
  usuarioId,
  setUsuariosBuscaComunidade,
  setCarregandoUsuariosBuscaComunidade,
  setUsuariosSeguidosIds,
}: UseComunidadeUserSearchSyncOptions) {
  useEffect(() => {
    let cancelado = false;
    const userId = usuarioId || "";

    if (!userId) {
      const limparUsuariosSeguidosTimer = window.setTimeout(() => {
        if (!cancelado) {
          setUsuariosSeguidosIds([]);
        }
      }, 0);

      return () => {
        cancelado = true;
        window.clearTimeout(limparUsuariosSeguidosTimer);
      };
    }

    void carregarUsuariosSeguidosComunidade(userId).then((idsSeguidos) => {
      if (!cancelado) {
        setUsuariosSeguidosIds(idsSeguidos);
      }
    });

    return () => {
      cancelado = true;
    };
  }, [usuarioId, setUsuariosSeguidosIds]);

  useEffect(() => {
    let cancelado = false;
    const termoLimpo = normalizarTermoBuscaUsuariosComunidade(termoBuscaAdiado);

    if (deveLimparBuscaUsuariosComunidade(buscaComunidadeAberta, termoLimpo)) {
      const limparBuscaUsuariosTimer = window.setTimeout(() => {
        if (!cancelado) {
          setUsuariosBuscaComunidade([]);
          setCarregandoUsuariosBuscaComunidade(false);
        }
      }, 0);

      return () => {
        cancelado = true;
        window.clearTimeout(limparBuscaUsuariosTimer);
      };
    }

    const buscaTimer = window.setTimeout(() => {
      if (cancelado) {
        return;
      }

      setCarregandoUsuariosBuscaComunidade(true);

      const usuariosLocais = buscarUsuariosComunidadeNosPosts(
        posts,
        termoLimpo
      );

      void buscarUsuariosComunidadeSupabase(termoLimpo)
        .then((usuariosSupabase) => {
          if (cancelado) {
            return;
          }

          const usuariosOrdenados =
            prepararResultadosBuscaUsuariosComunidade(
              usuariosSupabase,
              usuariosLocais,
              termoLimpo
            );

          setUsuariosBuscaComunidade(usuariosOrdenados);
        })
        .finally(() => {
          if (!cancelado) {
            setCarregandoUsuariosBuscaComunidade(false);
          }
        });
    }, 220);

    return () => {
      cancelado = true;
      window.clearTimeout(buscaTimer);
    };
  }, [
    buscaComunidadeAberta,
    posts,
    setCarregandoUsuariosBuscaComunidade,
    setUsuariosBuscaComunidade,
    termoBuscaAdiado,
  ]);
}
