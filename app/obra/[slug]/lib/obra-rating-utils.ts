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
