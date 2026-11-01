"use client";

import { useMemo, useState } from "react";
import type { ComentarioComunidade } from "../components/community-comment";
import {
  alternarMenuOrdenacaoComentariosComunidade,
  ordenacaoComentariosEhRecentesComunidade,
  ordenacaoComentariosEhRelevantesComunidade,
  selecionarOrdenacaoComentariosRecentesComunidade,
  selecionarOrdenacaoComentariosRelevantesComunidade,
  type OrdenacaoComentariosComunidade,
} from "../components/community-comment-order";
import { criarEstruturaComentariosComunidade } from "../components/community-comment-tree";

type UseCommunityCommentSheetOrderingParams = {
  comentarios: ComentarioComunidade[] | undefined;
};

export function useCommunityCommentSheetOrdering({
  comentarios,
}: UseCommunityCommentSheetOrderingParams) {
  const [ordenacaoComentarios, setOrdenacaoComentarios] =
    useState<OrdenacaoComentariosComunidade>("relevantes");
  const [menuOrdenacaoAberto, setMenuOrdenacaoAberto] = useState(false);
  const estruturaComentarios = useMemo(
    () =>
      criarEstruturaComentariosComunidade(
        comentarios || [],
        ordenacaoComentarios
      ),
    [ordenacaoComentarios, comentarios]
  );
  const ordenacaoRelevantesAtiva =
    ordenacaoComentariosEhRelevantesComunidade(ordenacaoComentarios);
  const ordenacaoRecentesAtiva =
    ordenacaoComentariosEhRecentesComunidade(ordenacaoComentarios);

  function alternarMenuOrdenacao() {
    alternarMenuOrdenacaoComentariosComunidade(setMenuOrdenacaoAberto);
  }

  function selecionarOrdenacaoRelevantes() {
    selecionarOrdenacaoComentariosRelevantesComunidade({
      setOrdenacaoComentarios,
      setMenuOrdenacaoAberto,
    });
  }

  function selecionarOrdenacaoRecentes() {
    selecionarOrdenacaoComentariosRecentesComunidade({
      setOrdenacaoComentarios,
      setMenuOrdenacaoAberto,
    });
  }

  function fecharMenuOrdenacao() {
    setMenuOrdenacaoAberto(false);
  }

  return {
    menuOrdenacaoAberto,
    estruturaComentarios,
    ordenacaoRelevantesAtiva,
    ordenacaoRecentesAtiva,
    alternarMenuOrdenacao,
    selecionarOrdenacaoRelevantes,
    selecionarOrdenacaoRecentes,
    fecharMenuOrdenacao,
  };
}
