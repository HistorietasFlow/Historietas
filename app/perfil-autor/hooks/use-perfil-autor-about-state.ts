"use client";

import { useState } from "react";

export function usePerfilAutorAboutState() {
  const [editorSobreAberto, setEditorSobreAberto] = useState(false);
  const [atividadeSobreAberta, setAtividadeSobreAberta] = useState(false);

  function alternarEditorSobre() {
    setEditorSobreAberto((aberto) => !aberto);
  }

  function alternarAtividadeSobre() {
    setAtividadeSobreAberta((valorAtual) => !valorAtual);
  }

  return {
    editorSobreAberto,
    setEditorSobreAberto,
    atividadeSobreAberta,
    setAtividadeSobreAberta,
    alternarEditorSobre,
    alternarAtividadeSobre,
  };
}
