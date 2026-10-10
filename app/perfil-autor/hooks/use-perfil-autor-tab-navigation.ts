import type { Dispatch, SetStateAction } from "react";
import type { AbaPerfilAutor } from "../types";

export function usePerfilAutorTabNavigation({
  setAbaPerfil,
}: {
  setAbaPerfil: Dispatch<SetStateAction<AbaPerfilAutor>>;
}) {
  function selecionarAbaPerfil(novaAba: AbaPerfilAutor) {
    setAbaPerfil(novaAba);

    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    params.set("aba", novaAba);

    const query = params.toString();
    const novaUrl = `${window.location.pathname}${
      query ? `?${query}` : ""
    }${window.location.hash}`;

    window.history.replaceState(window.history.state, "", novaUrl);
  }

  return { selecionarAbaPerfil };
}
