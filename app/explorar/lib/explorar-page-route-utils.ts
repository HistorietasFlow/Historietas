import type { ModoConteudoExplorar } from "../components/explorar-section-components";

export function atualizarUrlExplorar(
  categoria: string,
  modo: ModoConteudoExplorar
) {
  const params = new URLSearchParams();

  if (modo === "autores") {
    params.set("tipo", "autores");
  }

  if (categoria.trim()) {
    params.set("categoria", categoria.trim());
  }

  const query = params.toString();
  window.history.pushState(null, "", query ? `/explorar?${query}` : "/explorar");
}
