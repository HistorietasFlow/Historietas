"use client";

import { useState } from "react";
import type { AlvoDenunciaConteudoPerfil } from "../types";

export function usePerfilAutorReportState() {
  const [denunciaPerfilAberta, setDenunciaPerfilAberta] = useState(false);
  const [alvoDenunciaConteudoPerfil, setAlvoDenunciaConteudoPerfil] =
    useState<AlvoDenunciaConteudoPerfil>(null);

  function fecharDenunciaPerfil() {
    setDenunciaPerfilAberta(false);
  }

  function fecharDenunciaConteudo() {
    setAlvoDenunciaConteudoPerfil(null);
  }

  return {
    denunciaPerfilAberta,
    setDenunciaPerfilAberta,
    alvoDenunciaConteudoPerfil,
    setAlvoDenunciaConteudoPerfil,
    fecharDenunciaPerfil,
    fecharDenunciaConteudo,
  };
}
