"use client";

import { useState } from "react";

export function usePerfilAutorHeaderMenuState() {
  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false);
  const [usernameCabecalhoVisivel, setUsernameCabecalhoVisivel] =
    useState(false);

  function abrirMenuPerfil() {
    setMenuPerfilAberto(true);
  }

  function fecharMenuPerfil() {
    setMenuPerfilAberto(false);
  }

  function alternarUsernameCabecalho() {
    setUsernameCabecalhoVisivel((visivel) => !visivel);
  }

  return {
    menuPerfilAberto,
    setMenuPerfilAberto,
    usernameCabecalhoVisivel,
    setUsernameCabecalhoVisivel,
    abrirMenuPerfil,
    fecharMenuPerfil,
    alternarUsernameCabecalho,
  };
}
