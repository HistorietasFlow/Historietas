"use client";

import {
  useEffect,
} from "react";

import {
  criarLoginHrefPainelAutor,
} from "../lib/painel-autor-route-utils";

type RouterPainelAutorRedirect = {
  replace: (href: string) => void;
};

type UsePainelAutorLoginRedirectProps = {
  router: RouterPainelAutorRedirect;
  usuarioIdLogado: string;
  verificandoUsuario: boolean;
};

export function usePainelAutorLoginRedirect({
  router,
  usuarioIdLogado,
  verificandoUsuario,
}: UsePainelAutorLoginRedirectProps) {
  useEffect(() => {
    if (
      !verificandoUsuario &&
      !usuarioIdLogado
    ) {
      router.replace(
        criarLoginHrefPainelAutor(),
      );
    }
  }, [
    router,
    usuarioIdLogado,
    verificandoUsuario,
  ]);
}
