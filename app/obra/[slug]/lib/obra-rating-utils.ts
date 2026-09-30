import { normalizarTexto } from "../../../../lib/utils";

export function formatarMediaAvaliacao(media: number) {
  if (!Number.isFinite(media) || media <= 0) {
    return "0.0";
  }

  return media.toFixed(1);
}

export function formatarTotalAvaliacoes(total: number) {
  if (total <= 0) {
    return "avaliações";
  }

  return total === 1 ? "1 avaliação" : `${total} avaliações`;
}

export function obterProximaNotaAvaliacao(
  estrela: number,
  notaAtual: number,
) {
  const meiaNota = estrela - 0.5;
  const notaNormalizada = Math.round(notaAtual * 2) / 2;

  if (notaNormalizada === meiaNota) {
    return estrela;
  }

  if (notaNormalizada === estrela) {
    return 0;
  }

  return meiaNota;
}

export function obterPreenchimentoEstrela(
  estrela: number,
  notaAtual: number,
) {
  const notaNormalizada = Math.max(
    0,
    Math.min(5, Math.round(notaAtual * 2) / 2),
  );

  if (notaNormalizada >= estrela) {
    return "100%";
  }

  if (notaNormalizada >= estrela - 0.5) {
    return "50%";
  }

  return "0%";
}

export function obterChaveAvaliacaoObra(obra: {
  id: string;
  slug: string;
  titulo: string;
}) {
  return obra.id || obra.slug || normalizarTexto(obra.titulo);
}

export function calcularProximaAvaliacao(
  avaliacaoAtual: {
    media: number;
    total: number;
    minhaNota: number;
    carregado: boolean;
    salvando: boolean;
  },
  novaNota: number,
) {
  const notaAnterior = avaliacaoAtual.minhaNota;
  const totalAtual = avaliacaoAtual.total;
  const somaAtual = avaliacaoAtual.media * totalAtual;

  if (novaNota <= 0) {
    const totalNovo = notaAnterior > 0 ? Math.max(0, totalAtual - 1) : totalAtual;
    const somaNova = notaAnterior > 0 ? somaAtual - notaAnterior : somaAtual;

    return {
      ...avaliacaoAtual,
      media: totalNovo > 0 ? somaNova / totalNovo : 0,
      total: totalNovo,
      minhaNota: 0,
      carregado: true,
      salvando: true,
    };
  }

  const totalNovo = notaAnterior > 0 ? totalAtual : totalAtual + 1;
  const somaNova =
    notaAnterior > 0 ? somaAtual - notaAnterior + novaNota : somaAtual + novaNota;

  return {
    ...avaliacaoAtual,
    media: totalNovo > 0 ? somaNova / totalNovo : 0,
    total: totalNovo,
    minhaNota: novaNota,
    carregado: true,
    salvando: true,
  };
}
