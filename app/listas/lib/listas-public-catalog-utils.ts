import { normalizarTexto } from "../../../lib/utils";
import { timestampData } from "./listas-format-utils";

type ObraCatalogoLista = {
  id: string;
  genero: string;
  publicadaEm: string;
  visualizacoes: number;
  totalCurtidas: number;
  totalComentarios: number;
  capitulos: Array<{ criadoEm: string }>;
  notaMedia: number;
};

export function dataUltimoCapitulo(obra: ObraCatalogoLista) {
  return obra.capitulos.reduce((maisRecente, capitulo) => {
    return Math.max(maisRecente, timestampData(capitulo.criadoEm));
  }, timestampData(obra.publicadaEm));
}

export function pontuacaoPopularidadeObra(obra: ObraCatalogoLista) {
  return (
    obra.visualizacoes +
    obra.totalCurtidas * 8 +
    obra.totalComentarios * 5 +
    obra.capitulos.length * 2
  );
}

export function ordenarObrasDaSecao<TObra extends ObraCatalogoLista>(
  obras: TObra[],
  secao: string,
) {
  const lista = [...obras];

  if (secao === "novos-capitulos") {
    return lista
      .filter((obra) => obra.capitulos.length > 0 && dataUltimoCapitulo(obra) > 0)
      .sort(
        (a, b) =>
          dataUltimoCapitulo(b) - dataUltimoCapitulo(a) ||
          timestampData(b.publicadaEm) - timestampData(a.publicadaEm),
      );
  }

  if (secao === "mais-curtidas") {
    return lista
      .filter((obra) => obra.totalCurtidas > 0)
      .sort(
        (a, b) =>
          b.totalCurtidas - a.totalCurtidas ||
          pontuacaoPopularidadeObra(b) - pontuacaoPopularidadeObra(a),
      );
  }

  if (secao === "mais-comentadas") {
    return lista
      .filter((obra) => obra.totalComentarios > 0)
      .sort(
        (a, b) =>
          b.totalComentarios - a.totalComentarios ||
          pontuacaoPopularidadeObra(b) - pontuacaoPopularidadeObra(a),
      );
  }

  if (secao === "para-ler-agora") {
    return lista
      .filter((obra) => obra.capitulos.length > 0 && obra.capitulos.length <= 3)
      .sort(
        (a, b) =>
          a.capitulos.length - b.capitulos.length ||
          pontuacaoPopularidadeObra(b) - pontuacaoPopularidadeObra(a),
      );
  }

  if (secao === "em-alta") {
    return lista.sort(
      (a, b) =>
        pontuacaoPopularidadeObra(b) - pontuacaoPopularidadeObra(a) ||
        b.notaMedia - a.notaMedia ||
        timestampData(b.publicadaEm) - timestampData(a.publicadaEm),
    );
  }

  return lista.sort(
    (a, b) => timestampData(b.publicadaEm) - timestampData(a.publicadaEm),
  );
}

export function ordenarRecomendacoes<TObra extends ObraCatalogoLista>(
  obras: TObra[],
  idsInteracoes: string[],
) {
  const idsSet = new Set(idsInteracoes);
  const generosPreferidos = new Map<string, number>();

  obras.forEach((obra) => {
    if (!idsSet.has(obra.id)) {
      return;
    }

    const genero = normalizarTexto(obra.genero);
    generosPreferidos.set(genero, (generosPreferidos.get(genero) || 0) + 1);
  });

  return [...obras]
    .filter((obra) => !idsSet.has(obra.id))
    .sort((a, b) => {
      const pontuacao = (obra: TObra) => {
        const afinidade = generosPreferidos.get(normalizarTexto(obra.genero)) || 0;
        const nota = obra.notaMedia * 2;
        const popularidade = Math.min(
          8,
          pontuacaoPopularidadeObra(obra) / 1000,
        );
        const recencia = timestampData(obra.publicadaEm) / 1_000_000_000_000;
        return afinidade * 8 + nota + popularidade + recencia;
      };

      return pontuacao(b) - pontuacao(a);
    });
}
