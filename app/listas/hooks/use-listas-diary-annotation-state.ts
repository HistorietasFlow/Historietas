"use client";

import { useState } from "react";
import { EDITOR_ANOTACAO_LISTAS_VAZIO } from "../lib/listas-page-constants";
import type { InteracoesAnotacoesListasEstado } from "../lib/listas-diary-interactions-loader";
import type { EditorAnotacaoListasEstado } from "../types";

export function useListasDiaryAnnotationState() {
  const [editorAnotacao, setEditorAnotacao] =
    useState<EditorAnotacaoListasEstado>(EDITOR_ANOTACAO_LISTAS_VAZIO);
  const [interacoesAnotacoes, setInteracoesAnotacoes] =
    useState<InteracoesAnotacoesListasEstado>({});
  const [anotacoesAbertas, setAnotacoesAbertas] =
    useState<Record<string, boolean>>({});
  const [anotacoesSpoilerReveladas, setAnotacoesSpoilerReveladas] =
    useState<Record<string, boolean>>({});

  return {
    editorAnotacao,
    setEditorAnotacao,
    interacoesAnotacoes,
    setInteracoesAnotacoes,
    anotacoesAbertas,
    setAnotacoesAbertas,
    anotacoesSpoilerReveladas,
    setAnotacoesSpoilerReveladas,
  };
}
