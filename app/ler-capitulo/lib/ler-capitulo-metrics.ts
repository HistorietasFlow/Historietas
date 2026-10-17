import { carregarMetricasConteudos } from "../../../lib/metricas";
import type { MetricasCapituloLeitor } from "../hooks/use-ler-capitulo-interaction-data";
import type { CapituloLocal } from "./ler-capitulo-work-normalization";

export const metricasCapituloVazias: MetricasCapituloLeitor = {
  totalVisualizacoes: 0,
  totalCurtidas: 0,
  totalSalvos: 0,
  totalComentarios: 0,
  curtiu: false,
  salvo: false,
  carregado: false,
};

export function criarMetricasCapituloLocais(
  capitulo: CapituloLocal | null,
  totalComentarios = 0
): MetricasCapituloLeitor {
  if (!capitulo) {
    return metricasCapituloVazias;
  }

  return {
    totalVisualizacoes: Math.max(0, capitulo.visualizacoes || 0),
    totalCurtidas: capitulo.curtiu ? 1 : 0,
    totalSalvos: capitulo.salvo ? 1 : 0,
    totalComentarios,
    curtiu: capitulo.curtiu,
    salvo: capitulo.salvo,
    carregado: false,
  };
}

export async function carregarMetricasCapituloSupabase(
  capitulo: CapituloLocal,
  totalComentariosFallback: number
): Promise<MetricasCapituloLeitor> {
  const capituloId = capitulo.id.trim();

  if (!capituloId) {
    return criarMetricasCapituloLocais(capitulo, totalComentariosFallback);
  }

  const contrato = await carregarMetricasConteudos({
    capituloIds: [capituloId],
  });
  const metrica = contrato.capitulos.get(capituloId);

  if (!contrato.carregado || !metrica) {
    return {
      ...criarMetricasCapituloLocais(capitulo, totalComentariosFallback),
      carregado: true,
    };
  }

  return {
    totalVisualizacoes: metrica.visualizacoes,
    totalCurtidas: metrica.interacoes.curtidas,
    totalSalvos: metrica.interacoes.salvos,
    totalComentarios: Math.max(
      metrica.interacoes.comentarios,
      totalComentariosFallback
    ),
    curtiu: metrica.usuario.curtiu,
    salvo: metrica.usuario.salvou,
    carregado: true,
  };
}

export function formatarContadorCapituloLeitor(valor: number) {
  return Math.max(0, Math.round(valor)).toLocaleString("pt-BR");
}
