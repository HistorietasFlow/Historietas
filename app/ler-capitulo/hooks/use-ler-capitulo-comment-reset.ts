"use client";

import {
  useEffect,
  type Dispatch,
  type SetStateAction,
} from "react";

type UseLerCapituloCommentResetProps = {
  capituloId?: string;
  comentarioAtual?: string;
  usuarioIdLogado: string;

  setComentarioDigitado:
    Dispatch<SetStateAction<string>>;
  setComentarioStatus:
    Dispatch<SetStateAction<string>>;
  setMensagemAcao:
    Dispatch<SetStateAction<string>>;
  setMostrarComentario:
    Dispatch<SetStateAction<boolean>>;
};

export function useLerCapituloCommentReset({
  capituloId,
  comentarioAtual,
  usuarioIdLogado,
  setComentarioDigitado,
  setComentarioStatus,
  setMensagemAcao,
  setMostrarComentario,
}: UseLerCapituloCommentResetProps) {
  useEffect(() => {
    const atualizarComentarioTimer =
      window.setTimeout(() => {
        setComentarioDigitado(
          comentarioAtual || "",
        );

        setComentarioStatus("");
        setMensagemAcao("");
        setMostrarComentario(false);
      }, 0);

    return () => {
      window.clearTimeout(
        atualizarComentarioTimer,
      );
    };
  }, [
    capituloId,
    comentarioAtual,
    usuarioIdLogado,
    setComentarioDigitado,
    setComentarioStatus,
    setMensagemAcao,
    setMostrarComentario,
  ]);
}
