"use client";

import { useState } from "react";
import type { ItemObraLista } from "../types";

export function useListasDiaryCommentsState() {
  const [comentarioCurtindoId, setComentarioCurtindoId] = useState("");
  const [comentarioRemovendoId, setComentarioRemovendoId] = useState("");
  const [comentariosDiarioItem, setComentariosDiarioItem] =
    useState<ItemObraLista | null>(null);
  const [comentariosDiarioExpandido, setComentariosDiarioExpandido] =
    useState(false);
  const [menuOrdenacaoComentariosDiarioAberto, setMenuOrdenacaoComentariosDiarioAberto] =
    useState(false);
  const [respostasVisiveisComentariosDiario, setRespostasVisiveisComentariosDiario] =
    useState<Record<string, number>>({});

  return {
    comentarioCurtindoId,
    setComentarioCurtindoId,
    comentarioRemovendoId,
    setComentarioRemovendoId,
    comentariosDiarioItem,
    setComentariosDiarioItem,
    comentariosDiarioExpandido,
    setComentariosDiarioExpandido,
    menuOrdenacaoComentariosDiarioAberto,
    setMenuOrdenacaoComentariosDiarioAberto,
    respostasVisiveisComentariosDiario,
    setRespostasVisiveisComentariosDiario,
  };
}
