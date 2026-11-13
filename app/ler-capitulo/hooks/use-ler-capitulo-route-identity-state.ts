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
  const [identidadeInicial, setIdentidadeInicial] = useState({
    obraId: obraIdInicial,
    capituloId: capituloIdInicial,
  });

  // O App Router pode reutilizar este componente em outra rota canônica.
  // Reconcilie antes dos efeitos para não identificar a nova entrada com IDs antigos.
  // Props iguais (refresh/revalidação) não desfazem uma troca local de capítulo.
  if (
    identidadeInicial.obraId !== obraIdInicial ||
    identidadeInicial.capituloId !== capituloIdInicial
  ) {
    setIdentidadeInicial({ obraId: obraIdInicial, capituloId: capituloIdInicial });
    setObraId(obraIdInicial);
    setCapituloId(capituloIdInicial);
  }

  useEffect(() => {
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
    function sincronizarIdentidadeComHistorico(event: { state: unknown }) {
      let identidade = obterIdentidadeHistoricoLeitor(event.state);

      // A URL interna também corrige entradas antigas sem marcação ou divergentes.
      // Queries nunca definem a identidade de uma rota canônica pública.
      if (window.location.pathname === "/ler-capitulo") {
        const params = new URLSearchParams(window.location.search);
        identidade = {
          obraId: params.get("obraId") || "",
          capituloId: params.get("capituloId") || "",
        };
      }

      // Sem identidade confirmada, aguarde o carregador público existente.
      setObraId(identidade?.obraId || "");
      setCapituloId(identidade?.capituloId || "");
    }

    function restaurarIdentidade(event: PageTransitionEvent) {
      if (event.persisted) {
        sincronizarIdentidadeComHistorico({ state: window.history.state });
      }
    }

    window.addEventListener("popstate", sincronizarIdentidadeComHistorico);
    window.addEventListener("pageshow", restaurarIdentidade);

    return () => {
      window.removeEventListener("popstate", sincronizarIdentidadeComHistorico);
      window.removeEventListener("pageshow", restaurarIdentidade);
    };
  }, []);

  return { obraId, setObraId, capituloId, setCapituloId };
}
