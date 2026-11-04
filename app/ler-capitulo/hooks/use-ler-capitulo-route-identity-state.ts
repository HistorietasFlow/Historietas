"use client";

import { useEffect, useState } from "react";
import {
  criarEstadoHistoricoLeitor,
  obterIdentidadeHistoricoLeitor,
} from "../lib/ler-capitulo-navigation-actions";

export function useLerCapituloRouteIdentityState({
  obraIdInicial = "",
  capituloIdInicial = "",
}: {
  obraIdInicial?: string;
  capituloIdInicial?: string;
} = {}) {
  const [obraId, setObraId] = useState(obraIdInicial);
  const [capituloId, setCapituloId] = useState(capituloIdInicial);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("historietas:history-probe", { detail: { source: "identity-effect", obraId, capituloId } }));
    if (!obraId || !capituloId) {
      return;
    }

    const identidadeAtual = obterIdentidadeHistoricoLeitor(
      window.history.state,
    );

    if (
      identidadeAtual?.obraId === obraId &&
      identidadeAtual.capituloId === capituloId
    ) {
      return;
    }

    window.history.replaceState(
      criarEstadoHistoricoLeitor(window.history.state, {
        obraId,
        capituloId,
      }),
      "",
    );
  }, [obraId, capituloId]);

  useEffect(() => {
    function sincronizarIdentidadeComHistorico(event: PopStateEvent) {
      window.dispatchEvent(new CustomEvent("historietas:history-probe", { detail: { source: "reader-popstate", identity: obterIdentidadeHistoricoLeitor(event.state) } }));
      const identidade = obterIdentidadeHistoricoLeitor(event.state);

      if (!identidade) {
        return;
      }

      setObraId(identidade.obraId);
      setCapituloId(identidade.capituloId);
    }

    window.addEventListener("popstate", sincronizarIdentidadeComHistorico);

    return () => {
      window.removeEventListener("popstate", sincronizarIdentidadeComHistorico);
    };
  }, []);

  return { obraId, setObraId, capituloId, setCapituloId };
}
