"use client";

import { useState } from "react";

export function useSeguindoRequestActionState() {
  const [solicitacaoRespondendoId, setSolicitacaoRespondendoId] = useState<
    string | null
  >(null);
  const [usuarioListaAlterandoId, setUsuarioListaAlterandoId] = useState<
    string | null
  >(null);

  return {
    solicitacaoRespondendoId, setSolicitacaoRespondendoId,
    usuarioListaAlterandoId, setUsuarioListaAlterandoId,
  };
}
