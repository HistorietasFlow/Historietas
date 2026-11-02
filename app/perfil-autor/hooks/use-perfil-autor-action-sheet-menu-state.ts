"use client";

import { useState } from "react";

export function usePerfilAutorActionSheetMenuState() {
  const [obraMenuAbertoId, setObraMenuAbertoId] = useState("");
  const [bibliotecaMenuAbertoChave, setBibliotecaMenuAbertoChave] =
    useState("");

  function fecharMenuObra() {
    setObraMenuAbertoId("");
  }

  function fecharMenuBiblioteca() {
    setBibliotecaMenuAbertoChave("");
  }

  return {
    obraMenuAbertoId,
    setObraMenuAbertoId,
    bibliotecaMenuAbertoChave,
    setBibliotecaMenuAbertoChave,
    fecharMenuObra,
    fecharMenuBiblioteca,
  };
}
