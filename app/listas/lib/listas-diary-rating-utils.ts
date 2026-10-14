import { normalizarQuemPodeAvaliarDiarioListas } from "./listas-diary-normalizer-utils";
import { pegarBooleanoListas, pegarNumero } from "./listas-value-utils";

export type AvaliacaoDiarioListasEstado = {
  carregando: boolean;
  visivel: boolean;
  mostrar: boolean;
  permitir: boolean;
  quemPodeAvaliar: "todos" | "seguidores" | "ninguem";
  podeAvaliar: boolean;
  media: number;
  total: number;
  minhaNota: number;
  salvando: boolean;
  salvandoConfiguracoes: boolean;
  configuracoesAbertas: boolean;
  erro: string;
};

export const AVALIACAO_DIARIO_LISTAS_VAZIA: AvaliacaoDiarioListasEstado = {
  carregando: false,
  visivel: false,
  mostrar: true,
  permitir: true,
  quemPodeAvaliar: "todos",
  podeAvaliar: false,
  media: 0,
  total: 0,
  minhaNota: 0,
  salvando: false,
  salvandoConfiguracoes: false,
  configuracoesAbertas: false,
  erro: "",
};

export function normalizarAvaliacaoDiarioListas(
  valor: unknown,
  estadoAnterior: AvaliacaoDiarioListasEstado = AVALIACAO_DIARIO_LISTAS_VAZIA,
): AvaliacaoDiarioListasEstado {
  const registro =
    valor && typeof valor === "object" && !Array.isArray(valor)
      ? (valor as Record<string, unknown>)
      : {};

  return {
    ...estadoAnterior,
    carregando: false,
    visivel: pegarBooleanoListas(registro.visivel, false),
    mostrar: pegarBooleanoListas(registro.mostrar, true),
    permitir: pegarBooleanoListas(registro.permitir, true),
    quemPodeAvaliar: normalizarQuemPodeAvaliarDiarioListas(
      registro.quem_pode_avaliar ?? registro.quemPodeAvaliar,
    ),
    podeAvaliar: pegarBooleanoListas(
      registro.pode_avaliar ?? registro.podeAvaliar,
      false,
    ),
    media: Math.max(0, Math.min(5, pegarNumero(registro.media, 0))),
    total: Math.max(0, Math.trunc(pegarNumero(registro.total, 0))),
    minhaNota: Math.max(
      0,
      Math.min(
        5,
        Math.round(
          pegarNumero(registro.minha_nota ?? registro.minhaNota, 0) * 2,
        ) / 2,
      ),
    ),
    salvando: false,
    salvandoConfiguracoes: false,
    erro: "",
  };
}

export function obterProximaNotaAvaliacaoListas(estrela: number, notaAtual: number) {
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

export function calcularProximaAvaliacaoDiarioListas(
  avaliacaoAtual: AvaliacaoDiarioListasEstado,
  novaNota: number,
): AvaliacaoDiarioListasEstado {
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
      salvando: true,
      erro: "",
    };
  }

  const totalNovo = notaAnterior > 0 ? totalAtual : totalAtual + 1;
  const somaNova =
    notaAnterior > 0
      ? somaAtual - notaAnterior + novaNota
      : somaAtual + novaNota;

  return {
    ...avaliacaoAtual,
    media: totalNovo > 0 ? somaNova / totalNovo : 0,
    total: totalNovo,
    minhaNota: novaNota,
    salvando: true,
    erro: "",
  };
}

export function obterPreenchimentoEstrelaListas(estrela: number, notaAtual: number) {
  const notaNormalizada = Math.max(
    0,
    Math.min(5, Math.round(notaAtual * 2) / 2),
  );

  if (notaNormalizada >= estrela) return "100%";
  if (notaNormalizada >= estrela - 0.5) return "50%";
  return "0%";
}
