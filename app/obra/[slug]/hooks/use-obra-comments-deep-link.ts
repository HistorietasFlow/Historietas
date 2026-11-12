"use client";

import { useEffect, useRef } from "react";

export function deveAbrirComentariosObraPorBusca(search: string) {
  return new URLSearchParams(search).get("comentarios") === "1";
}

type UseObraCommentsDeepLinkParams = {
  abrirComentariosObra: () => void;
  pronto?: boolean;
  chaveRota?: string;
};

export function useObraCommentsDeepLink({
  abrirComentariosObra,
  pronto = true,
  chaveRota = "",
}: UseObraCommentsDeepLinkParams) {
  const abrirComentariosObraRef = useRef(abrirComentariosObra);
  const rotaAbertaRef = useRef<string | null>(null);

  useEffect(() => {
    abrirComentariosObraRef.current = abrirComentariosObra;
  }, [abrirComentariosObra]);

  useEffect(() => {
    function sincronizarComentariosComUrl() {
      const deveAbrir = deveAbrirComentariosObraPorBusca(
        window.location.search,
      );

      if (!deveAbrir) {
        rotaAbertaRef.current = null;
        return;
      }

      if (pronto && rotaAbertaRef.current !== chaveRota) {
        rotaAbertaRef.current = chaveRota;
        abrirComentariosObraRef.current();
      }
    }

    sincronizarComentariosComUrl();
    window.addEventListener("popstate", sincronizarComentariosComUrl);

    return () => {
      window.removeEventListener("popstate", sincronizarComentariosComUrl);
    };
  }, [pronto, chaveRota]);
}
