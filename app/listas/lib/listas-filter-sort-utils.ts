import { normalizarTexto } from "../../../lib/utils";
import { timestampData } from "./listas-format-utils";
import { textoCategorias } from "./listas-profile-text-utils";
import {
  dataUltimoCapitulo,
  pontuacaoPopularidadeObra,
} from "./listas-public-catalog-utils";

type ItemPerfilFiltroListas = {
  obra: {
    titulo: string;
    autor: string;
    genero: string;
    formato: string;
    notaMedia: number;
    visualizacoes: number;
  };
  categorias: string[];
  nota: number;
  data: string;
};

type ObraPublicaFiltroListas = {
  id: string;
  titulo: string;
  autor: string;
  genero: string;
  formato: string;
  notaMedia: number;
  totalAvaliacoes: number;
  totalCurtidas: number;
  totalComentarios: number;
  publicadaEm: string;
  visualizacoes: number;
  capitulos: Array<{ criadoEm: string }>;
};

type AutorFiltroListas = {
  nome: string;
  username: string;
  bio: string;
  generos: string[];
  notaMedia: number;
  totalAvaliacoes: number;
  totalObras: number;
  totalCurtidas: number;
  totalComentarios: number;
  criadaEm: string;
};

export function filtrarOrdenarItensPerfilListas<TItem extends ItemPerfilFiltroListas>(
  itensPerfil: TItem[],
  busca: string,
  ordenacao: string,
) {
  const buscaNormalizada = normalizarTexto(busca);
  let itens = [...itensPerfil];

  if (buscaNormalizada) {
    itens = itens.filter((item) =>
      normalizarTexto(
        [
          item.obra.titulo,
          item.obra.autor,
          item.obra.genero,
          item.obra.formato,
          textoCategorias(item.categorias),
        ].join(" "),
      ).includes(buscaNormalizada),
    );
  }

  itens.sort((a, b) => {
    if (ordenacao === "titulo") {
      return a.obra.titulo.localeCompare(b.obra.titulo, "pt-BR");
    }

    if (ordenacao === "avaliacao") {
      return (
        (b.nota || b.obra.notaMedia) - (a.nota || a.obra.notaMedia) ||
        timestampData(b.data) - timestampData(a.data)
      );
    }

    if (ordenacao === "popularidade") {
      return b.obra.visualizacoes - a.obra.visualizacoes;
    }

    return timestampData(b.data) - timestampData(a.data);
  });

  return itens;
}

export function filtrarOrdenarObrasPublicasListas<
  TObra extends ObraPublicaFiltroListas,
>(obrasPublicas: TObra[], busca: string, ordenacao: string, secao: string) {
  const buscaNormalizada = normalizarTexto(busca);
  let obras = [...obrasPublicas];

  if (buscaNormalizada) {
    obras = obras.filter((obra) =>
      normalizarTexto(
        [obra.titulo, obra.autor, obra.genero, obra.formato].join(" "),
      ).includes(buscaNormalizada),
    );
  }

  obras.sort((a, b) => {
    if (ordenacao === "titulo") {
      return a.titulo.localeCompare(b.titulo, "pt-BR");
    }

    if (ordenacao === "avaliacao") {
      return b.notaMedia - a.notaMedia || b.totalAvaliacoes - a.totalAvaliacoes;
    }

    if (secao === "novos-capitulos") {
      return dataUltimoCapitulo(b) - dataUltimoCapitulo(a);
    }

    if (secao === "mais-curtidas") {
      return b.totalCurtidas - a.totalCurtidas;
    }

    if (secao === "mais-comentadas") {
      return b.totalComentarios - a.totalComentarios;
    }

    if (secao === "para-ler-agora") {
      return (
        a.capitulos.length - b.capitulos.length ||
        pontuacaoPopularidadeObra(b) - pontuacaoPopularidadeObra(a)
      );
    }

    if (ordenacao === "popularidade") {
      return pontuacaoPopularidadeObra(b) - pontuacaoPopularidadeObra(a);
    }

    return timestampData(b.publicadaEm) - timestampData(a.publicadaEm);
  });

  return obras;
}

export function filtrarOrdenarAutoresListas<TAutor extends AutorFiltroListas>(
  autores: TAutor[],
  busca: string,
  ordenacao: string,
) {
  const buscaNormalizada = normalizarTexto(busca);
  let lista = [...autores];

  if (buscaNormalizada) {
    lista = lista.filter((autor) =>
      normalizarTexto(
        [autor.nome, autor.username, autor.bio, ...autor.generos].join(" "),
      ).includes(buscaNormalizada),
    );
  }

  lista.sort((a, b) => {
    if (ordenacao === "titulo") {
      return a.nome.localeCompare(b.nome, "pt-BR");
    }

    if (ordenacao === "avaliacao") {
      return (
        b.notaMedia - a.notaMedia ||
        b.totalAvaliacoes - a.totalAvaliacoes ||
        b.totalObras - a.totalObras
      );
    }

    if (ordenacao === "popularidade") {
      const pontuacao = (autor: AutorFiltroListas) =>
        autor.totalObras * 12 +
        autor.totalCurtidas * 4 +
        autor.totalComentarios * 3;

      return pontuacao(b) - pontuacao(a) || b.totalObras - a.totalObras;
    }

    if (ordenacao === "recentes") {
      return timestampData(b.criadaEm) - timestampData(a.criadaEm);
    }

    return b.totalObras - a.totalObras || a.nome.localeCompare(b.nome, "pt-BR");
  });

  return lista;
}
