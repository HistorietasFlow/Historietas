import {
  normalizarCategoriaPerfil,
  normalizarModoLista,
  normalizarOrdenacao,
  normalizarOrigemPerfil,
} from "./listas-route-utils";
import { pegarTexto } from "./listas-value-utils";
import {
  type CategoriaPerfil,
  type ModoLista,
  type OrdenacaoLista,
  type OrigemPerfil,
} from "../types";

type SearchParamsListas = Pick<URLSearchParams, "get" | "toString">;

export function obterEstadoRotaListas(searchParams: SearchParamsListas) {
  const queryAtual = searchParams.toString();

  const modo: ModoLista = normalizarModoLista(searchParams.get("modo"));
  const origemPerfil: OrigemPerfil = normalizarOrigemPerfil(
    searchParams.get("origem"),
  );
  const categoriaUrl: CategoriaPerfil = normalizarCategoriaPerfil(
    searchParams.get("categoria"),
  );
  const userIdUrl =
    searchParams.get("usuario") ||
    searchParams.get("userId") ||
    searchParams.get("autorId") ||
    "";
  const secao = pegarTexto(searchParams.get("secao"), "catalogo");
  const genero = pegarTexto(searchParams.get("genero"));
  const tituloPersonalizado = pegarTexto(searchParams.get("titulo"));
  const obraAlvoId = pegarTexto(
    searchParams.get("obra") || searchParams.get("obraId"),
  );
  const ordenacao: OrdenacaoLista = normalizarOrdenacao(
    searchParams.get("ordem"),
  );

  return {
    queryAtual,
    modo,
    origemPerfil,
    categoriaUrl,
    userIdUrl,
    secao,
    genero,
    tituloPersonalizado,
    obraAlvoId,
    ordenacao,
  };
}
