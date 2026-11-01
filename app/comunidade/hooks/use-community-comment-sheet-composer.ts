"use client";

import { useState } from "react";
import type { FormEvent, RefObject } from "react";
import type { ComentarioComunidade } from "../components/community-comment";
import type { RespostaComentarioComunidade } from "../components/community-comment-reply";

type UseCommunityCommentSheetComposerParams = {
  comentarioRef: RefObject<HTMLTextAreaElement | null>;
  podeComentar: boolean;
  post: { id: string } | null;
  onEnviar: (
    postId: string,
    texto: string,
    comentarioPaiId: string
  ) => boolean | Promise<boolean>;
  iniciarAcaoComentario: (chave: string) => boolean;
  finalizarAcaoComentario: (chave: string) => void;
  garantirRespostasVisiveis: (comentarioId: string) => void;
};

export function useCommunityCommentSheetComposer({
  comentarioRef,
  podeComentar,
  post,
  onEnviar,
  iniciarAcaoComentario,
  finalizarAcaoComentario,
  garantirRespostasVisiveis,
}: UseCommunityCommentSheetComposerParams) {
  const [comentarioEnviando, setComentarioEnviando] = useState(false);
  const [respostaComentario, setRespostaComentario] =
    useState<RespostaComentarioComunidade | null>(null);

  function limparRespostaComentario() {
    setRespostaComentario(null);
  }

  function responderComentario(
    comentario: ComentarioComunidade,
    comentarioRaizId: string
  ) {
    if (!podeComentar) {
      return;
    }

    const nomeLimpo = comentario.autorNome.replace(/\s+/g, " ").trim();
    const raizIdLimpo = comentarioRaizId.trim();

    if (!nomeLimpo || !raizIdLimpo) {
      return;
    }

    setRespostaComentario({
      comentarioPaiId: raizIdLimpo,
      autorId: comentario.autorId,
      autorNome: nomeLimpo,
    });

    window.setTimeout(() => {
      if (!comentarioRef.current) {
        return;
      }

      const mencao = `@${nomeLimpo} `;
      comentarioRef.current.value = mencao;
      comentarioRef.current.focus();
      comentarioRef.current.setSelectionRange(mencao.length, mencao.length);
    }, 0);
  }

  async function enviarComentario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!post) {
      return;
    }

    const chaveAcao = `enviar-comentario:${post.id}`;

    if (!iniciarAcaoComentario(chaveAcao)) {
      return;
    }

    setComentarioEnviando(true);

    try {
      const conteudoComentario = comentarioRef.current?.value || "";
      const respostaAnterior = respostaComentario;
      const enviado = await onEnviar(
        post.id,
        conteudoComentario,
        respostaAnterior?.comentarioPaiId || ""
      );

      if (enviado && comentarioRef.current) {
        comentarioRef.current.value = "";
        setRespostaComentario(null);

        if (respostaAnterior?.comentarioPaiId) {
          garantirRespostasVisiveis(respostaAnterior.comentarioPaiId);
        }
      }
    } finally {
      finalizarAcaoComentario(chaveAcao);
      setComentarioEnviando(false);
    }
  }

  return {
    comentarioEnviando,
    limparRespostaComentario,
    responderComentario,
    enviarComentario,
  };
}
