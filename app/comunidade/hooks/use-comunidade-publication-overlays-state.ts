"use client";

import { useState } from "react";
import type { DenunciaAlvoComunidade } from "../components/community-report-target";

export function useComunidadePublicationOverlaysState() {
  const [postMenuAbertoId, setPostMenuAbertoId] = useState<string | null>(null);
  const [denunciaAlvo, setDenunciaAlvo] =
    useState<DenunciaAlvoComunidade | null>(null);
  const [comentariosPostId, setComentariosPostId] = useState<string | null>(null);

  function fecharMenuPublicacao() {
    setPostMenuAbertoId(null);
  }

  function fecharDenunciaPublicacao() {
    setDenunciaAlvo(null);
  }

  return {
    postMenuAbertoId,
    setPostMenuAbertoId,
    denunciaAlvo,
    setDenunciaAlvo,
    comentariosPostId,
    setComentariosPostId,
    fecharMenuPublicacao,
    fecharDenunciaPublicacao,
  };
}
