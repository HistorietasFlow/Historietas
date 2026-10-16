import { criarSlugBase, normalizarTexto } from "../../../lib/utils";
import type { CapituloLocal, ObraLocal } from "./em-alta-models";

export function formatarNumero(numero: number) {
  if (!Number.isFinite(numero)) {
    return "0";
  }

  return numero.toLocaleString("pt-BR");
}

export function formatarMediaRanking(media: number) {
  if (!Number.isFinite(media) || media <= 0) {
    return "0";
  }

  const mediaArredondada = Math.round(media * 10) / 10;

  return Number.isInteger(mediaArredondada)
    ? String(mediaArredondada)
    : mediaArredondada.toFixed(1);
}

export function normalizarVisualizacoesRanking(valor: unknown) {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return {};
  }

  return Object.entries(valor as Record<string, unknown>).reduce<
    Record<string, number>
  >((visualizacoesNormalizadas, [chave, total]) => {
    const chaveLimpa = chave.trim();
    const totalNumerico =
      typeof total === "number" && Number.isFinite(total) ? total : 0;

    if (chaveLimpa && totalNumerico > 0) {
      visualizacoesNormalizadas[chaveLimpa] = Math.round(totalNumerico);
    }

    return visualizacoesNormalizadas;
  }, {});
}

export function obterVisualizacoesRegistradasObra(
  obra: ObraLocal,
  visualizacoesRegistradas: Record<string, number>,
) {
  const chavesObra = [
    obra.id,
    obra.slug,
    criarSlugBase(obra.titulo),
    normalizarTexto(obra.titulo),
  ];

  return chavesObra.reduce((maiorTotal, chave) => {
    const total = visualizacoesRegistradas[chave] || 0;

    return Math.max(maiorTotal, total);
  }, 0);
}

export function normalizarAvaliacoesLocaisRanking(valor: unknown) {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return {};
  }

  return Object.entries(valor as Record<string, unknown>).reduce<
    Record<string, number>
  >((avaliacoesNormalizadas, [chave, nota]) => {
    const chaveLimpa = chave.trim();
    const notaNumerica =
      typeof nota === "number" && Number.isFinite(nota)
        ? Math.round(nota * 2) / 2
        : 0;

    if (chaveLimpa && notaNumerica >= 0.5 && notaNumerica <= 5) {
      avaliacoesNormalizadas[chaveLimpa] = notaNumerica;
    }

    return avaliacoesNormalizadas;
  }, {});
}

export function obterAvaliacaoLocalRanking(
  obra: ObraLocal,
  avaliacoesLocais: Record<string, number>,
) {
  const chavesObra = [
    obra.id,
    obra.slug,
    criarSlugBase(obra.titulo),
    normalizarTexto(obra.titulo),
  ];

  return chavesObra.reduce((maiorNota, chave) => {
    const nota = avaliacoesLocais[chave] || 0;

    return Math.max(maiorNota, nota);
  }, 0);
}

export function formatarDataRanking(timestamp: number) {
  if (!timestamp) {
    return "Sem data";
  }

  const data = new Date(timestamp);

  if (Number.isNaN(data.getTime())) {
    return "Sem data";
  }

  return data.toLocaleDateString("pt-BR");
}

export function formatarGeneroCard(genero: string) {
  const generoLimpo = genero.trim();

  if (normalizarTexto(generoLimpo) === "fantasia sombria") {
    return "Fantasia";
  }

  return generoLimpo || "Não informado";
}

export function calcularCapitulosLidos(capitulos: CapituloLocal[]) {
  return capitulos.filter((capitulo) => capitulo.lido).length;
}

export function calcularProgressoLeitura(capitulos: CapituloLocal[]) {
  if (capitulos.length === 0) {
    return 0;
  }

  return Math.round(
    (calcularCapitulosLidos(capitulos) / capitulos.length) * 100,
  );
}
