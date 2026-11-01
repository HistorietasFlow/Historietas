"use client";

import { useState } from "react";
import type { FormEvent, RefObject } from "react";
import type {
  ComentarioCapituloPublico,
  ComentariosCapituloPost,
} from "../components/ler-capitulo-comments-sheet";

type RespostaComentarioCapitulo = {
  comentarioPaiId: string;
  autorId: string;
  autorNome: string;
};

type UseLerCapituloCommentSheetComposerParams = {
  comentarioRef: RefObject<HTMLTextAreaElement | null>;
  podeComentar: boolean;
  post: ComentariosCapituloPost | null;
  onEnviar: (
    postId: string,
    texto: string,
    comentarioPaiId: string
  ) => boolean | Promise<boolean>;
  iniciarAcaoComentario: (chave: string) => boolean;
  finalizarAcaoComentario: (chave: string) => void;
  garantirRespostasVisiveis: (comentarioId: string) => void;
};

export function useLerCapituloCommentSheetComposer({
  comentarioRef,
  podeComentar,
  post,
  onEnviar,
  iniciarAcaoComentario,
  finalizarAcaoComentario,
  garantirRespostasVisiveis,
}: UseLerCapituloCommentSheetComposerParams) {
  const [comentarioEnviando, setComentarioEnviando] = useState(false);
  const [respostaComentario, setRespostaComentario] =
    useState<RespostaComentarioCapitulo | null>(null);

  function limparRespostaComentario() {
    setRespostaComentario(null);
  }

  function responderComentario(
    comentario: ComentarioCapituloPublico,
    comentarioRaizId: string
  ) {
    if (!podeComentar) {
      return;
    }

    const nomeLimpo = comentario.nome.replace(/\s+/g, " ").trim();
    const raizIdLimpo = comentarioRaizId.trim();

    if (!nomeLimpo || !raizIdLimpo) {
      return;
    }

    setRespostaComentario({
      comentarioPaiId: raizIdLimpo,
      autorId: comentario.userId,
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
