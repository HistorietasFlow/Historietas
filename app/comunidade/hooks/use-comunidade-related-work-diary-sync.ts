"use client";

import { useEffect } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { registrarReviewComunidadeNoDiario } from "../components/community-diary-review-registrar";
import { sincronizarReviewsPendentesSequencialmenteComunidade } from "../components/community-pending-reviews-sync";
import type { PostComunidade } from "../components/community-post-model";
import { prepararSugestoesObrasRelacionadasComunidade } from "../components/community-related-work-suggestions-preparation";
import type { ObraRelacionadaSugestao } from "../components/community-related-work-suggestion";

type UseComunidadeRelatedWorkDiarySyncOptions = {
  usuarioId: string | undefined;
  posts: PostComunidade[];
  obrasRelacionadasSugestoes: ObraRelacionadaSugestao[];
  setObrasRelacionadasSugestoes: Dispatch<
    SetStateAction<ObraRelacionadaSugestao[]>
  >;
  reviewsDiarioSincronizadasRef: RefObject<Set<string>>;
  usuarioReviewsDiarioRef: RefObject<string>;
};

export function useComunidadeRelatedWorkDiarySync({
  usuarioId,
  posts,
  obrasRelacionadasSugestoes,
  setObrasRelacionadasSugestoes,
  reviewsDiarioSincronizadasRef,
  usuarioReviewsDiarioRef,
}: UseComunidadeRelatedWorkDiarySyncOptions) {
  useEffect(() => {
    let cancelado = false;

    async function carregarObrasRelacionadas() {
      const sugestoesObrasRelacionadas =
        await prepararSugestoesObrasRelacionadasComunidade(usuarioId || "");

      if (!cancelado) {
        setObrasRelacionadasSugestoes(sugestoesObrasRelacionadas);
      }
    }

    void carregarObrasRelacionadas();

    return () => {
      cancelado = true;
    };
  }, [usuarioId, setObrasRelacionadasSugestoes]);

  useEffect(() => {
    const userId = usuarioId?.trim() || "";

    if (!userId) {
      reviewsDiarioSincronizadasRef.current.clear();
      usuarioReviewsDiarioRef.current = "";
      return;
    }

    if (usuarioReviewsDiarioRef.current !== userId) {
      reviewsDiarioSincronizadasRef.current.clear();
      usuarioReviewsDiarioRef.current = userId;
    }

    const reviewsPendentes = posts.filter((post) => {
      return (
        post.autorId.trim() === userId &&
        post.tipoPublicacao === "Review" &&
        !reviewsDiarioSincronizadasRef.current.has(post.id)
      );
    });

    if (reviewsPendentes.length === 0) {
      return;
    }

    let cancelado = false;

    void sincronizarReviewsPendentesSequencialmenteComunidade({
      reviewsPendentes,
      reviewsSincronizadas: reviewsDiarioSincronizadasRef.current,
      cancelamentoSolicitado: () => cancelado,
      sincronizarReview: (post) =>
        registrarReviewComunidadeNoDiario({
          userId,
          texto: post.texto,
          obraRelacionada: post.obraRelacionada,
          postId: post.id,
          criadaEm: post.criadoEm,
          sugestoesObras: obrasRelacionadasSugestoes,
          visibilidade: post.visibilidade,
        }),
    });

    return () => {
      cancelado = true;
    };
  }, [
    usuarioId,
    posts,
    obrasRelacionadasSugestoes,
    reviewsDiarioSincronizadasRef,
    usuarioReviewsDiarioRef,
  ]);
}
