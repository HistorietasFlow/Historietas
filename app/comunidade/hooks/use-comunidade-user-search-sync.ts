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
import { aplicarAlteracoesSeguimentoComunidade } from "../components/community-user-follow-context";
import type { ContextoSeguimentoComunidade } from "../components/community-user-follow-context";
import type { UsuarioBuscaComunidade } from "../components/community-user";

type UseComunidadeUserSearchSyncOptions = {
  buscaComunidadeAberta: boolean;
  posts: PostComunidade[];
  termoBusca: string;
  usuarioId: string | undefined;
  contextoSeguimento: ContextoSeguimentoComunidade;
  setUsuariosBuscaComunidade: Dispatch<SetStateAction<UsuarioBuscaComunidade[]>>;
  setCarregandoUsuariosBuscaComunidade: Dispatch<SetStateAction<boolean>>;
  setUsuariosSeguidosIds: Dispatch<SetStateAction<string[]>>;
};

export function useComunidadeUserSearchSync({
  buscaComunidadeAberta,
  posts,
  termoBusca,
  usuarioId,
  contextoSeguimento,
  setUsuariosBuscaComunidade,
  setCarregandoUsuariosBuscaComunidade,
  setUsuariosSeguidosIds,
}: UseComunidadeUserSearchSyncOptions) {
  useEffect(() => {
    let cancelado = false;
    const userId = usuarioId || "";
    const vigente = () => !cancelado && contextoSeguimento.vigente();

    if (!userId) {
      const limparUsuariosSeguidosTimer = window.setTimeout(() => {
        if (vigente()) {
          setUsuariosSeguidosIds([]);
        }
      }, 0);

      return () => {
        cancelado = true;
        window.clearTimeout(limparUsuariosSeguidosTimer);
      };
    }

    void carregarUsuariosSeguidosComunidade(userId).then((idsSeguidos) => {
      if (vigente()) {
        contextoSeguimento.idsCarregados = idsSeguidos;
        setUsuariosSeguidosIds(aplicarAlteracoesSeguimentoComunidade(
          idsSeguidos, contextoSeguimento.alteracoes
        ));
      }
    }).catch(() => {
      // Não substitua as ações locais por um snapshot que não foi obtido.
    });

    return () => {
      cancelado = true;
    };
  }, [usuarioId, contextoSeguimento, setUsuariosSeguidosIds]);

  useEffect(() => {
    let cancelado = false;
    const vigente = () => !cancelado && contextoSeguimento.vigente();
    const termoLimpo = normalizarTermoBuscaUsuariosComunidade(termoBusca);

    if (deveLimparBuscaUsuariosComunidade(buscaComunidadeAberta, termoLimpo)) {
      const limparBuscaUsuariosTimer = window.setTimeout(() => {
        if (vigente()) {
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
      if (!vigente()) {
        return;
      }

      setCarregandoUsuariosBuscaComunidade(true);

      const usuariosLocais = buscarUsuariosComunidadeNosPosts(
        posts,
        termoLimpo
      );

      void buscarUsuariosComunidadeSupabase(termoLimpo)
        .then((usuariosSupabase) => {
          if (!vigente()) {
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
        .catch(() => {
          if (vigente()) {
            setUsuariosBuscaComunidade(prepararResultadosBuscaUsuariosComunidade(
              [], usuariosLocais, termoLimpo
            ));
          }
        })
        .finally(() => {
          if (vigente()) {
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
    contextoSeguimento,
    posts,
    setCarregandoUsuariosBuscaComunidade,
    setUsuariosBuscaComunidade,
    termoBusca,
  ]);
}
