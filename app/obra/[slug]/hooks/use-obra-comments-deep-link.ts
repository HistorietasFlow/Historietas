"use client";

import { useEffect, useRef } from "react";

export function deveAbrirComentariosObraPorBusca(search: string) {
  return new URLSearchParams(search).get("comentarios") === "1";
}

type UseObraCommentsDeepLinkParams = {
  abrirComentariosObra: () => void;
};

export function useObraCommentsDeepLink({
  abrirComentariosObra,
}: UseObraCommentsDeepLinkParams) {
  const abrirComentariosObraRef = useRef(abrirComentariosObra);

  useEffect(() => {
    abrirComentariosObraRef.current = abrirComentariosObra;
  }, [abrirComentariosObra]);

  useEffect(() => {
    let abriuUrlAtual = false;

    function sincronizarComentariosComUrl() {
      const deveAbrir = deveAbrirComentariosObraPorBusca(
        window.location.search,
      );

      if (!deveAbrir) {
        abriuUrlAtual = false;
        return;
      }

      if (!abriuUrlAtual) {
        abriuUrlAtual = true;
        abrirComentariosObraRef.current();
      }
    }

    sincronizarComentariosComUrl();
    window.addEventListener("popstate", sincronizarComentariosComUrl);

    return () => {
      window.removeEventListener("popstate", sincronizarComentariosComUrl);
    };
  }, []);
}
