import { normalizarTexto } from "../../../lib/utils";
import type { AutorRanking, ObraRanking } from "./em-alta-models";
import { criarLinkPerfilAutorRanking } from "./em-alta-route-utils";

export function calcularRankingAutores(
  ranking: ObraRanking[],
): AutorRanking[] {
  type AutorRankingAcumulado = AutorRanking & {
    somaNotas: number;
    pesoNotas: number;
  };

  const autoresPorChave = new Map<string, AutorRankingAcumulado>();

  ranking.forEach((obra) => {
    const nome = obra.autor.trim();
    const nomeNormalizado = normalizarTexto(nome);

    if (!nome || nomeNormalizado === "autor nao informado") {
      return;
    }

    const autorId = obra.autorId?.trim() || "";
    const chave = autorId || `nome:${nomeNormalizado}`;
    const pesoNota =
      obra.avaliacoes > 0 ? obra.avaliacoes : obra.mediaAvaliacao > 0 ? 1 : 0;
    const existente = autoresPorChave.get(chave);

    if (!existente) {
      autoresPorChave.set(chave, {
        id: chave,
        nome,
        autorId,
        avatar: obra.autorAvatar,
        href: criarLinkPerfilAutorRanking(nome, autorId),
        obras: 1,
        capitulos: obra.capitulos,
        seguidores: obra.seguidoresAutor,
        seguidoresObras: obra.salvos,
        views: obra.views,
        curtidas: obra.curtidas,
        comentarios: obra.comentarios,
        avaliacoes: obra.avaliacoes,
        mediaAvaliacao: 0,
        pontuacao: 0,
        somaNotas: obra.mediaAvaliacao * pesoNota,
        pesoNotas: pesoNota,
      });

      return;
    }

    existente.obras += 1;
    existente.capitulos += obra.capitulos;
    existente.seguidores = Math.max(
      existente.seguidores,
      obra.seguidoresAutor,
    );
    existente.seguidoresObras += obra.salvos;
    existente.views += obra.views;
    existente.curtidas += obra.curtidas;
    existente.comentarios += obra.comentarios;
    existente.avaliacoes += obra.avaliacoes;
    existente.somaNotas += obra.mediaAvaliacao * pesoNota;
    existente.pesoNotas += pesoNota;

    if (!existente.avatar && obra.autorAvatar) {
      existente.avatar = obra.autorAvatar;
    }

    if (!existente.autorId && autorId) {
      existente.autorId = autorId;
      existente.href = criarLinkPerfilAutorRanking(existente.nome, autorId);
    }
  });

  return Array.from(autoresPorChave.values())
    .map((autor) => {
      const mediaAvaliacao =
        autor.pesoNotas > 0 ? autor.somaNotas / autor.pesoNotas : 0;
      const pontuacao =
        autor.obras * 1 +
        autor.seguidores * 4 +
        autor.seguidoresObras * 4 +
        autor.views * 1 +
        autor.curtidas * 2 +
        autor.comentarios * 3 +
        autor.avaliacoes * 4 +
        Math.round(mediaAvaliacao * 4);

      const {
        somaNotas: _somaNotas,
        pesoNotas: _pesoNotas,
        ...autorFinal
      } = autor;
      void _somaNotas;
      void _pesoNotas;

      return {
        ...autorFinal,
        mediaAvaliacao,
        pontuacao,
      };
    })
    .sort((autorA, autorB) => {
      if (autorB.pontuacao !== autorA.pontuacao) {
        return autorB.pontuacao - autorA.pontuacao;
      }

      if (autorB.views !== autorA.views) {
        return autorB.views - autorA.views;
      }

      return autorA.nome.localeCompare(autorB.nome, "pt-BR");
    })
    .slice(0, 5);
}
