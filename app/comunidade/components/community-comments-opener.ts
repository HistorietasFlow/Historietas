import type { Dispatch, SetStateAction } from "react";

type AbrirComentariosParams = {
  postId: string;
  setErro: Dispatch<SetStateAction<string>>;
  comentarioUrlAplicadoRef: { current: boolean };
  setComentariosPostId: Dispatch<SetStateAction<string | null>>;
};

export function abrirComentarios({
  postId,
  setErro,
  comentarioUrlAplicadoRef,
  setComentariosPostId,
}: AbrirComentariosParams): void {
  setErro("");
  comentarioUrlAplicadoRef.current = true;
  setComentariosPostId(postId);

  try {
    const url = new URL(window.location.href);
    url.pathname = "/comunidade";
    url.search = `?post=${encodeURIComponent(postId)}`;
    url.hash = "";
    window.history.replaceState(null, "", url.toString());
  } catch {
    // Se o navegador bloquear a URL, os comentários continuam abrindo em estado local.
  }
}
