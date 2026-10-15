import { normalizarTexto } from "../../lib/utils";
import { formatarGeneroHome } from "./home-metadata-utils";

type CapituloBuscaHome = {
  titulo: string;
};

type ObraLocalBuscaHome = {
  titulo: string;
  autor: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  sinopse: string;
  tags: string[];
  capaNome: string;
  capitulos: CapituloBuscaHome[];
};

type ObraCatalogoBuscaHome = {
  titulo: string;
  autor: string;
  genero: string;
  classificacaoIndicativa: string;
  status: string;
};

export function obraLocalCombinaBusca(obra: ObraLocalBuscaHome, termoBusca: string) {
  if (!termoBusca) {
    return true;
  }

  const textoObra = normalizarTexto(
    [
      obra.titulo,
      obra.autor,
      obra.genero,
      formatarGeneroHome(obra.genero),
      obra.formato,
      obra.classificacaoIndicativa,
      obra.sinopse,
      obra.tags.join(" "),
      obra.capaNome,
      obra.capitulos.map((capitulo) => capitulo.titulo).join(" "),
    ].join(" ")
  );

  return textoObra.includes(termoBusca);
}

export function obraCatalogoCombinaBuscaHome(obra: ObraCatalogoBuscaHome, termoBusca: string) {
  if (!termoBusca) {
    return true;
  }

  const textoObra = normalizarTexto(
    [
      obra.titulo,
      obra.autor,
      obra.genero,
      formatarGeneroHome(obra.genero),
      obra.classificacaoIndicativa,
      obra.status,
    ].join(" ")
  );

  return textoObra.includes(termoBusca);
}

export function obterTemasRecomendacaoObra(obra: ObraLocalBuscaHome) {
  return Array.from(
    new Set(
      [
        obra.genero,
        formatarGeneroHome(obra.genero),
        obra.formato,
        ...obra.tags,
      ]
        .map((tema) => normalizarTexto(tema))
        .filter((tema) => tema && tema !== "sem tags" && tema !== "nao informado")
    )
  );
}

export function obterTemasRecomendacaoObraCatalogo(obra: ObraCatalogoBuscaHome) {
  return Array.from(
    new Set(
      [
        obra.genero,
        formatarGeneroHome(obra.genero),
        obra.status,
        obra.classificacaoIndicativa,
      ]
        .map((tema) => normalizarTexto(tema))
        .filter((tema) => tema && tema !== "nao informado")
    )
  );
}

export function obraCombinaComTemasRecomendados(obra: ObraLocalBuscaHome, temas: Set<string>) {
  if (temas.size === 0) {
    return false;
  }

  return obterTemasRecomendacaoObra(obra).some((tema) => temas.has(tema));
}

export function obraCatalogoCombinaComTemasRecomendados(obra: ObraCatalogoBuscaHome, temas: Set<string>) {
  if (temas.size === 0) {
    return false;
  }

  return obterTemasRecomendacaoObraCatalogo(obra).some((tema) =>
    temas.has(tema)
  );
}

export function obraCatalogoCombinaTemas(obra: ObraCatalogoBuscaHome, temas: string[]) {
  const textoObra = normalizarTexto(
    [
      obra.titulo,
      obra.autor,
      obra.genero,
      formatarGeneroHome(obra.genero),
      obra.status,
    ].join(" ")
  );

  return temas.some((tema) => textoObra.includes(normalizarTexto(tema)));
}
