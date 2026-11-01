"use client";

import { useRef, useState } from "react";

type UseLerCapituloCommentSheetActionsParams = {
  onCurtirComentario: (
    postId: string,
    comentarioId: string
  ) => void | Promise<void>;
  onRemoverComentario: (
    postId: string,
    comentarioId: string
  ) => void | Promise<void>;
  onDenunciarComentario: (
    comentarioId: string
  ) => void | Promise<void>;
};

export function useLerCapituloCommentSheetActions({
  onCurtirComentario,
  onRemoverComentario,
  onDenunciarComentario,
}: UseLerCapituloCommentSheetActionsParams) {
  const comentarioAcoesRef = useRef<Set<string>>(new Set<string>());
  const [comentarioCurtindoId, setComentarioCurtindoId] = useState<string | null>(null);
  const [comentarioRemovendoId, setComentarioRemovendoId] = useState<string | null>(null);
  const [comentarioDenunciandoId, setComentarioDenunciandoId] = useState<string | null>(null);

  function iniciarAcaoComentario(chave: string) {
    if (comentarioAcoesRef.current.has(chave)) {
      return false;
    }

    comentarioAcoesRef.current.add(chave);
    return true;
  }

  function finalizarAcaoComentario(chave: string) {
    comentarioAcoesRef.current.delete(chave);
  }

  async function curtirComentarioSeguro(postId: string, comentarioId: string) {
    const chaveAcao = `curtir-comentario:${comentarioId}`;

    if (!iniciarAcaoComentario(chaveAcao)) {
      return;
    }

    setComentarioCurtindoId(comentarioId);

    try {
      await onCurtirComentario(postId, comentarioId);
    } finally {
      finalizarAcaoComentario(chaveAcao);
      setComentarioCurtindoId((comentarioAtualId) =>
        comentarioAtualId === comentarioId ? null : comentarioAtualId
      );
    }
  }

  async function removerComentarioSeguro(postId: string, comentarioId: string) {
    const chaveAcao = `remover-comentario:${comentarioId}`;

    if (!iniciarAcaoComentario(chaveAcao)) {
      return;
    }

    setComentarioRemovendoId(comentarioId);

    try {
      await onRemoverComentario(postId, comentarioId);
    } finally {
      finalizarAcaoComentario(chaveAcao);
      setComentarioRemovendoId((comentarioAtualId) =>
        comentarioAtualId === comentarioId ? null : comentarioAtualId
      );
    }
  }

  async function denunciarComentarioSeguro(comentarioId: string) {
    const chaveAcao = `denunciar-comentario:${comentarioId}`;

    if (!iniciarAcaoComentario(chaveAcao)) {
      return;
    }

    setComentarioDenunciandoId(comentarioId);

    try {
      await onDenunciarComentario(comentarioId);
    } finally {
      finalizarAcaoComentario(chaveAcao);
      setComentarioDenunciandoId((comentarioAtualId) =>
        comentarioAtualId === comentarioId ? null : comentarioAtualId
      );
    }
  }

  return {
    comentarioCurtindoId,
    comentarioRemovendoId,
    comentarioDenunciandoId,
    iniciarAcaoComentario,
    finalizarAcaoComentario,
    curtirComentarioSeguro,
    removerComentarioSeguro,
    denunciarComentarioSeguro,
  };
}
