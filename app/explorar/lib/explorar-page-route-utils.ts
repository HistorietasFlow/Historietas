import type { ModoConteudoExplorar } from "../components/explorar-section-components";
import { categorias } from "./explorar-categories";
import type { OrdenacaoExplorar } from "./explorar-derived-utils";

const LIMITE_BUSCA_EXPLORAR = 90;
const ORDENACOES_COMPARTILHAVEIS_EXPLORAR = new Set<OrdenacaoExplorar>([
  "relevancia",
  "mais-curtidas",
  "mais-recentes",
]);

export type FiltrosCompartilhaveisExplorar = Readonly<{
  modoConteudo: ModoConteudoExplorar;
  categoriaSelecionada: string;
  busca: string;
  ordenacao: OrdenacaoExplorar;
}>;

export const FILTROS_COMPARTILHAVEIS_EXPLORAR_PADRAO = {
  modoConteudo: "obras",
  categoriaSelecionada: "",
  busca: "",
  ordenacao: "relevancia",
} as const satisfies FiltrosCompartilhaveisExplorar;

function normalizarCategoriaExplorar(valor: string | null) {
  const categoriaInformada = valor?.trim() || "";

  return (
    categorias.find(
      (categoria) =>
        categoria.localeCompare(categoriaInformada, "pt-BR", {
          sensitivity: "base",
        }) === 0,
    ) || ""
  );
}

function normalizarOrdenacaoExplorar(
  valor: string | null,
): OrdenacaoExplorar {
  const ordenacao = valor?.trim() as OrdenacaoExplorar;

  return ORDENACOES_COMPARTILHAVEIS_EXPLORAR.has(ordenacao)
    ? ordenacao
    : "relevancia";
}

function normalizarBuscaExplorar(valor: string | null) {
  return (valor || "").trim().slice(0, LIMITE_BUSCA_EXPLORAR);
}

export function lerFiltrosCompartilhaveisExplorar(
  search: string,
): FiltrosCompartilhaveisExplorar {
  const params = new URLSearchParams(search);

  return {
    modoConteudo: params.get("tipo") === "autores" ? "autores" : "obras",
    categoriaSelecionada: normalizarCategoriaExplorar(
      params.get("categoria"),
    ),
    busca: normalizarBuscaExplorar(params.get("busca")),
    ordenacao: normalizarOrdenacaoExplorar(params.get("ordenacao")),
  };
}

export function criarUrlExplorar(
  filtros: FiltrosCompartilhaveisExplorar,
) {
  const params = new URLSearchParams();

  if (filtros.modoConteudo === "autores") {
    params.set("tipo", "autores");
  }

  const categoria = normalizarCategoriaExplorar(
    filtros.categoriaSelecionada,
  );
  if (categoria) {
    params.set("categoria", categoria);
  }

  const busca = normalizarBuscaExplorar(filtros.busca);
  if (busca) {
    params.set("busca", busca);
  }

  const ordenacao = normalizarOrdenacaoExplorar(filtros.ordenacao);
  if (ordenacao !== "relevancia") {
    params.set("ordenacao", ordenacao);
  }

  const query = params.toString();
  return query ? `/explorar?${query}` : "/explorar";
}

export function atualizarUrlExplorar(
  filtros: FiltrosCompartilhaveisExplorar,
  modoHistorico: "push" | "replace" = "push",
) {
  const url = criarUrlExplorar(filtros);
  const urlAtual = `${window.location.pathname}${window.location.search}`;

  if (url === urlAtual) {
    return;
  }

  if (modoHistorico === "replace") {
    window.history.replaceState(null, "", url);
    return;
  }

  window.history.pushState(null, "", url);
}

export function observarFiltrosCompartilhaveisExplorar(
  aplicarFiltros: (filtros: FiltrosCompartilhaveisExplorar) => void,
) {
  function sincronizarFiltrosComHistorico() {
    aplicarFiltros(
      lerFiltrosCompartilhaveisExplorar(window.location.search),
    );
  }

  window.addEventListener("popstate", sincronizarFiltrosComHistorico);

  return () => {
    window.removeEventListener("popstate", sincronizarFiltrosComHistorico);
  };
}
