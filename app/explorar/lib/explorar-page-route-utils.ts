import type { ModoConteudoExplorar } from "../components/explorar-section-components";
import { categorias } from "./explorar-categories";
import { OPCOES_FORMATO_OBRA } from "../../publicar/lib/publicar-static-options";
import type { OrdenacaoExplorar } from "./explorar-derived-utils";
import { normalizarTagCatalogo } from "../../../lib/catalogo-tag";
import { normalizarNotaMinimaCatalogo } from "../../../lib/catalogo-nota-minima";

const LIMITE_BUSCA_EXPLORAR = 90;
const ORDENACOES_COMPARTILHAVEIS_EXPLORAR = new Set<OrdenacaoExplorar>([
  "relevancia",
  "mais-curtidas",
  "mais-recentes",
  "mais-capitulos",
]);

export type FiltrosCompartilhaveisExplorar = Readonly<{
  modoConteudo: ModoConteudoExplorar;
  categoriaSelecionada: string;
  busca: string;
  ordenacao: OrdenacaoExplorar;
  filtroFormato: string;
  filtroTag?: string;
  tagExcluida?: string;
  notaMinima?: number | null;
}>;

export const FILTROS_COMPARTILHAVEIS_EXPLORAR_PADRAO = {
  modoConteudo: "obras",
  categoriaSelecionada: "",
  busca: "",
  ordenacao: "relevancia",
  filtroFormato: "todos",
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
  modoConteudo: ModoConteudoExplorar,
): OrdenacaoExplorar {
  const ordenacao = valor?.trim() as OrdenacaoExplorar;

  if (modoConteudo === "autores" && ordenacao === "mais-capitulos") {
    return "relevancia";
  }

  return ORDENACOES_COMPARTILHAVEIS_EXPLORAR.has(ordenacao)
    ? ordenacao
    : "relevancia";
}

function normalizarBuscaExplorar(valor: string | null) {
  return (valor || "").trim().slice(0, LIMITE_BUSCA_EXPLORAR);
}

function normalizarFormatoExplorar(valor: string | null | undefined) {
  return OPCOES_FORMATO_OBRA.find(
    (formato) => formato.localeCompare(valor?.trim() || "", "pt-BR", {
      sensitivity: "base",
    }) === 0,
  ) || "todos";
}

export function lerFiltrosCompartilhaveisExplorar(
  search: string,
): FiltrosCompartilhaveisExplorar {
  const params = new URLSearchParams(search);
  const modoConteudo = params.get("tipo") === "autores" ? "autores" : "obras";
  const notaMinima = modoConteudo === "obras"
    ? normalizarNotaMinimaCatalogo(params.get("notaMinima")) : null;

  return {
    modoConteudo,
    categoriaSelecionada: normalizarCategoriaExplorar(
      params.get("categoria"),
    ),
    busca: normalizarBuscaExplorar(params.get("busca")),
    ordenacao: normalizarOrdenacaoExplorar(params.get("ordenacao"), modoConteudo),
    filtroFormato: normalizarFormatoExplorar(params.get("formato")),
    ...(notaMinima !== null ? { notaMinima } : {}),
    ...(modoConteudo === "obras" && normalizarTagCatalogo(params.get("tagExcluida"))
      ? { tagExcluida: normalizarTagCatalogo(params.get("tagExcluida")) } : {}),
    ...(normalizarTagCatalogo(params.get("tag"))
      ? { filtroTag: normalizarTagCatalogo(params.get("tag")) }
      : {}),
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

  const ordenacao = normalizarOrdenacaoExplorar(filtros.ordenacao, filtros.modoConteudo);
  if (ordenacao !== "relevancia") {
    params.set("ordenacao", ordenacao);
  }

  const formato = normalizarFormatoExplorar(filtros.filtroFormato);
  if (formato !== "todos") {
    params.set("formato", formato);
  }

  const tag = normalizarTagCatalogo(filtros.filtroTag);
  if (tag) params.set("tag", tag);
  const tagExcluida = filtros.modoConteudo === "obras"
    ? normalizarTagCatalogo(filtros.tagExcluida) : "";
  if (tagExcluida) params.set("tagExcluida", tagExcluida);
  const notaMinima = filtros.modoConteudo === "obras"
    ? normalizarNotaMinimaCatalogo(filtros.notaMinima) : null;
  if (notaMinima !== null) params.set("notaMinima", String(notaMinima));
  const queryComTag = params.toString();
  return queryComTag ? `/explorar?${queryComTag}` : "/explorar";
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
