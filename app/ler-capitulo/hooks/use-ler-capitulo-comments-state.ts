"use client";

import { useState } from "react";
import type { ComentarioCapituloPublico } from "../components/ler-capitulo-comments-sheet";

export function useLerCapituloCommentsState() {
  const [comentarioDigitado, setComentarioDigitado] = useState("");
  const [comentarioStatus, setComentarioStatus] = useState("");
  const [comentariosCapitulo, setComentariosCapitulo] =
    useState<ComentarioCapituloPublico[]>([]);
  const [comentariosCarregando, setComentariosCarregando] = useState(false);
  const [mostrarComentario, setMostrarComentario] = useState(false);

  return {
    comentarioDigitado,
    setComentarioDigitado,
    comentarioStatus,
    setComentarioStatus,
    comentariosCapitulo,
    setComentariosCapitulo,
    comentariosCarregando,
    setComentariosCarregando,
    mostrarComentario,
    setMostrarComentario,
  };
}
