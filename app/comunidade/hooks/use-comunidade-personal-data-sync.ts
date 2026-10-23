"use client";

import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { carregarVotosEnquetesLocais } from "../components/community-local-poll-votes-loader";
import { salvarVotosEnquetesLocais } from "../components/community-local-poll-votes-saver";
import { carregarPostsSalvosLocaisComunidade } from "../components/community-local-saved-posts-loader";
import type { PostComunidade } from "../components/community-post-model";
import { postEhEnquete } from "../components/community-post-poll-check";
import type { ResultadoVotosEnquete } from "../components/community-poll-votes-result";
import { carregarVotosEnquetesSupabase } from "../components/community-supabase-poll-votes-loader";
import { carregarPostsSalvosSupabaseComunidade } from "../components/community-supabase-saved-posts-loader";
import { CHAVE_POSTS_SALVOS_COMUNIDADE } from "../components/community-storage-keys";
import { carregarJsonUsuarioComunidade } from "../components/community-user-json-loader";
import { salvarJsonUsuarioComunidade } from "../components/community-user-json-saver";

type UseComunidadeSavedPostsSyncOptions = {
  usuarioId: string | undefined;
  setPostsSalvosIds: Dispatch<SetStateAction<string[]>>;
  setVotosEnquetes: Dispatch<SetStateAction<Record<string, string>>>;
};

export function useComunidadeSavedPostsSync({
  usuarioId,
  setPostsSalvosIds,
  setVotosEnquetes,
}: UseComunidadeSavedPostsSyncOptions) {
  useEffect(() => {
    const userId = usuarioId || "";
    let cancelado = false;

    const carregarLocaisTimer = window.setTimeout(() => {
      setPostsSalvosIds(
        carregarPostsSalvosLocaisComunidade(
          carregarJsonUsuarioComunidade,
          userId
        )
      );

      setVotosEnquetes(
        carregarVotosEnquetesLocais(carregarJsonUsuarioComunidade, userId)
      );

      if (!userId) {
        return;
      }

      void carregarPostsSalvosSupabaseComunidade(userId).then((postsSalvosReais) => {
        if (cancelado || !postsSalvosReais) {
          return;
        }

        setPostsSalvosIds(postsSalvosReais);
        salvarJsonUsuarioComunidade(
          CHAVE_POSTS_SALVOS_COMUNIDADE,
          userId,
          postsSalvosReais
        );
      });
    }, 0);

    return () => {
      cancelado = true;
      window.clearTimeout(carregarLocaisTimer);
    };
  }, [usuarioId, setPostsSalvosIds, setVotosEnquetes]);
}

type UseComunidadePollVotesSyncOptions = {
  posts: PostComunidade[];
  usuarioId: string | undefined;
  setVotosEnquetes: Dispatch<SetStateAction<Record<string, string>>>;
  setResultadosEnquetes: Dispatch<SetStateAction<ResultadoVotosEnquete>>;
};

export function useComunidadePollVotesSync({
  posts,
  usuarioId,
  setVotosEnquetes,
  setResultadosEnquetes,
}: UseComunidadePollVotesSyncOptions) {
  useEffect(() => {
    let cancelado = false;

    async function carregarVotosReaisEnquetes() {
      const postsEnqueteIds = posts
        .filter((post) => postEhEnquete(post))
        .map((post) => post.id)
        .filter(Boolean);

      if (postsEnqueteIds.length === 0) {
        window.setTimeout(() => {
          if (!cancelado) {
            setResultadosEnquetes({});
          }
        }, 0);
        return;
      }

      const votosLocais = carregarVotosEnquetesLocais(
        carregarJsonUsuarioComunidade,
        usuarioId || ""
      );

      window.setTimeout(() => {
        if (!cancelado) {
          setVotosEnquetes((votosAtuais) => ({
            ...votosLocais,
            ...votosAtuais,
          }));
        }
      }, 0);

      if (!usuarioId) {
        return;
      }

      const votosReais = await carregarVotosEnquetesSupabase(
        postsEnqueteIds,
        usuarioId
      );

      if (cancelado || !votosReais) {
        return;
      }

      window.setTimeout(() => {
        if (cancelado) {
          return;
        }

        setResultadosEnquetes(votosReais.resultados);

        setVotosEnquetes((votosAtuais) => {
          const votosAtualizados = {
            ...votosAtuais,
            ...votosReais.meusVotos,
          };

          salvarVotosEnquetesLocais(
            salvarJsonUsuarioComunidade,
            votosAtualizados,
            usuarioId
          );

          return votosAtualizados;
        });
      }, 0);
    }

    void carregarVotosReaisEnquetes();

    return () => {
      cancelado = true;
    };
  }, [posts, usuarioId, setResultadosEnquetes, setVotosEnquetes]);
}
